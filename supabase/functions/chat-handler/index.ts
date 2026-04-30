import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tier caps — canonical source: src/lib/aiTierLimits.ts (TIER_LIMITS).
// Keep these values in sync with that file. BYO-key orgs are uncapped (handled elsewhere).
const TIER_CAPS: Record<string, number> = {
  free: 0,
  starter: 50,
  professional: 1_000,
  enterprise: 5_000,
};

function capForTier(tier: string | null | undefined): number {
  const t = (tier ?? 'free').toLowerCase();
  return TIER_CAPS[t] ?? TIER_CAPS.free;
}

// Simple in-memory rate limiting (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX_REQUESTS = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  limit.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                      req.headers.get('x-real-ip') ||
                      'unknown';

    if (!checkRateLimit(ipAddress)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, sessionId, chatbotId } = await req.json();
    console.log('Processing chat message:', { sessionId, chatbotId, messageLength: message?.length, ip: ipAddress });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch chatbot + parent org tier
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('*, organizations:organization_id(id, subscription_tier)')
      .eq('id', chatbotId)
      .single();

    if (chatbotError || !chatbot) {
      console.error('Error fetching chatbot:', chatbotError);
      throw new Error('Chatbot not found');
    }

    const orgId = chatbot.organization_id as string;
    const tier = (chatbot.organizations as any)?.subscription_tier ?? 'free';

    // ---- Platform-admin org bypass ----
    // If any member of the org is a platform admin, skip cap enforcement entirely.
    // Mirrors frontend `usePlatformAdmin` semantics so internal/admin orgs are uncapped.
    let isPlatformOrg = false;
    try {
      const { data: adminMembers } = await supabase
        .from('memberships')
        .select('user_id, profiles:user_id(is_platform_admin)')
        .eq('organization_id', orgId);
      if (adminMembers?.some((m: any) => m.profiles?.is_platform_admin === true)) {
        isPlatformOrg = true;
      } else {
        // Fallback: check platform_roles table directly
        const userIds = (adminMembers ?? []).map((m: any) => m.user_id);
        if (userIds.length > 0) {
          const { data: roles } = await supabase
            .from('platform_roles')
            .select('user_id')
            .eq('role', 'platform_admin')
            .in('user_id', userIds);
          if ((roles?.length ?? 0) > 0) isPlatformOrg = true;
        }
      }
    } catch (err) {
      console.warn('Platform-admin bypass check failed, continuing with normal cap logic:', err);
    }

    // ---- BYO key lookup (secret stored in Supabase Vault) ----
    const { data: openaiIntegration } = await supabase
      .from('integrations')
      .select('vault_secret_id, status')
      .eq('organization_id', orgId)
      .eq('provider', 'openai')
      .eq('status', 'active')
      .maybeSingle();

    let byoKey: string | undefined;
    if (openaiIntegration?.vault_secret_id) {
      const { data: secret } = await supabase.rpc(
        'get_integration_vault_secret_internal',
        { _org_id: orgId, _provider: 'openai' },
      );
      byoKey = (secret as string | null) ?? undefined;
    }
    const usingByoKey = !!byoKey;

    // ---- Cap check (only if NOT using BYO key) ----
    let capInfo: { used: number; cap: number; tier: string } | null = null;
    if (!usingByoKey && !isPlatformOrg) {
      // Per-org override
      const { data: override } = await supabase
        .from('org_ai_usage_overrides')
        .select('monthly_message_cap')
        .eq('organization_id', orgId)
        .maybeSingle();

      const cap = override?.monthly_message_cap ?? capForTier(tier);

      const { data: usage } = await supabase
        .from('org_ai_usage_current_period')
        .select('messages_count_platform')
        .eq('organization_id', orgId)
        .maybeSingle();

      const used = (usage?.messages_count_platform as number | undefined) ?? 0;
      capInfo = { used, cap, tier };

      if (used >= cap) {
        console.warn(`Cap reached for org ${orgId}: ${used}/${cap} (${tier})`);
        return new Response(
          JSON.stringify({
            error: 'cap_reached',
            message: cap === 0
              ? `AI chat is not included in the ${tier} plan. Please upgrade to Starter or higher to enable this chatbot.`
              : `This chatbot has reached its monthly message limit (${used}/${cap} on the ${tier} plan). Please upgrade or contact the site owner.`,
            tier,
            cap,
            used,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const apiKey = byoKey ?? Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // ---- Session ----
    let session;
    if (sessionId) {
      const { data } = await supabase
        .from('chat_sessions').select('*').eq('id', sessionId).single();
      session = data;
    }
    if (!session) {
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert([{ chatbot_id: chatbotId, status: 'active' }])
        .select().single();
      if (sessionError) throw new Error('Failed to create chat session');
      session = newSession;
    }

    const userAgent = req.headers.get('user-agent') || 'unknown';
    const origin = req.headers.get('origin') || req.headers.get('referer') || 'unknown';

    await supabase.from('chatbot_events').insert({
      chatbot_id: chatbotId,
      session_id: session.id,
      event_type: 'message_sent',
      event_data: { message_length: message.length, origin },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await supabase.from('chat_messages').insert([{
      session_id: session.id, role: 'user', content: message,
    }]);

    const { data: messages } = await supabase
      .from('chat_messages').select('role, content')
      .eq('session_id', session.id).order('created_at', { ascending: true });

    // ---- Vector retrieval ----
    let retrievedChunks: Array<{ source_name: string; content_chunk: string; similarity: number }> = [];
    let usedFallback = false;
    let embedTokens = 0;

    try {
      const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: message }),
      });
      if (embedRes.ok) {
        const embedData = await embedRes.json();
        embedTokens = embedData.usage?.total_tokens ?? 0;
        const queryEmbedding = embedData.data[0].embedding;
        const { data: matches, error: matchErr } = await supabase.rpc('match_knowledge_chunks', {
          query_embedding: queryEmbedding,
          match_chatbot_id: chatbotId,
          match_count: 6,
          similarity_threshold: 0.3,
        });
        if (matchErr) {
          usedFallback = true;
        } else {
          retrievedChunks = matches || [];
        }
      } else {
        usedFallback = true;
      }
    } catch (err) {
      console.warn('Vector retrieval error, falling back:', err);
      usedFallback = true;
    }

    // Log embedding usage
    if (embedTokens > 0) {
      await supabase.from('ai_usage_events').insert({
        organization_id: orgId,
        chatbot_id: chatbotId,
        event_type: 'embedding',
        model: 'text-embedding-3-small',
        tokens_input: embedTokens,
        used_byo_key: usingByoKey,
      });
    }

    let knowledgeSources: Array<{ name: string; content: string | null }> = [];
    if (usedFallback || retrievedChunks.length === 0) {
      const { data } = await supabase
        .from('knowledge_sources').select('content, name')
        .eq('chatbot_id', chatbotId).eq('status', 'completed');
      knowledgeSources = data || [];
    }

    const { data: faqs } = await supabase
      .from('chatbot_faqs').select('question, answer')
      .eq('chatbot_id', chatbotId).order('order_index', { ascending: true });

    let contextContent = '';
    if (retrievedChunks.length > 0) {
      contextContent = retrievedChunks.map(c => `[${c.source_name}] ${c.content_chunk}`).join('\n\n');
    } else if (knowledgeSources.length > 0) {
      contextContent = knowledgeSources.map(s => `${s.name}: ${s.content}`).join('\n\n');
    }
    if (faqs && faqs.length > 0) {
      const faqContent = faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n');
      contextContent += contextContent ? `\n\n--- Frequently Asked Questions ---\n${faqContent}` : faqContent;
    }

    const widgetConfig = (chatbot as any).web_widget_config || {};
    let additionalContext = '';
    if (widgetConfig.email_contact || widgetConfig.phone_contact) {
      additionalContext += '\n\n--- Contact Information ---\n';
      if (widgetConfig.email_contact) additionalContext += `Email: ${widgetConfig.email_contact}\n`;
      if (widgetConfig.phone_contact) additionalContext += `Phone: ${widgetConfig.phone_contact}\n`;
    }
    if (widgetConfig.show_donations && (widgetConfig.donation_button_1 || widgetConfig.donation_button_2)) {
      additionalContext += '\n\n--- Donation Options ---\n';
      if (widgetConfig.donation_button_1) additionalContext += `${widgetConfig.donation_button_1.label}: ${widgetConfig.donation_button_1.url}\n`;
      if (widgetConfig.donation_button_2) additionalContext += `${widgetConfig.donation_button_2.label}: ${widgetConfig.donation_button_2.url}\n`;
    }
    contextContent += additionalContext;

    // Defensive cap: never let knowledge context blow past the model context window or cost budget.
    const MAX_CONTEXT_CHARS = 12_000;
    if (contextContent.length > MAX_CONTEXT_CHARS) {
      contextContent = contextContent.slice(0, MAX_CONTEXT_CHARS) + '\n\n[...context truncated]';
    }

    const systemPrompt = chatbot.description || 'You are a helpful AI assistant.';
    const openAIMessages = [
      { role: 'system', content: `${systemPrompt}\n\nContext from knowledge base:\n${contextContent}` },
      ...(messages || []).map(msg => ({ role: msg.role, content: msg.content })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAIMessages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get AI response');
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices[0].message.content;
    const promptTokens = aiResponse.usage?.prompt_tokens ?? 0;
    const completionTokens = aiResponse.usage?.completion_tokens ?? 0;

    // Log chat_message usage (this is what counts toward the cap)
    await supabase.from('ai_usage_events').insert({
      organization_id: orgId,
      chatbot_id: chatbotId,
      event_type: 'chat_message',
      model: 'gpt-4o-mini',
      tokens_input: promptTokens,
      tokens_output: completionTokens,
      used_byo_key: usingByoKey,
    });

    await supabase.from('chat_messages').insert([{
      session_id: session.id, role: 'assistant', content: assistantMessage,
    }]);

    await supabase.from('chatbot_events').insert({
      chatbot_id: chatbotId,
      session_id: session.id,
      event_type: 'message_answered',
      event_data: { response_length: assistantMessage.length, model_used: 'gpt-4o-mini' },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Soft warning if approaching cap
    let warning: string | null = null;
    if (capInfo) {
      const newUsed = capInfo.used + 1;
      const pct = newUsed / capInfo.cap;
      if (pct >= 0.95) warning = 'cap_critical';
      else if (pct >= 0.8) warning = 'cap_warn';
    }

    return new Response(JSON.stringify({
      message: assistantMessage,
      sessionId: session.id,
      usage: capInfo
        ? { used: capInfo.used + 1, cap: capInfo.cap, tier: capInfo.tier, byo: false }
        : { byo: usingByoKey, platformOrg: isPlatformOrg },
      warning,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in chat-handler:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
