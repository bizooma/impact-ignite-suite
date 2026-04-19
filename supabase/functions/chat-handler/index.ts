import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  limit.count++;
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get IP address for rate limiting
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    // Check rate limit
    if (!checkRateLimit(ipAddress)) {
      console.warn('Rate limit exceeded for IP:', ipAddress);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { message, sessionId, chatbotId } = await req.json();
    console.log('Processing chat message:', { sessionId, chatbotId, messageLength: message?.length, ip: ipAddress });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get chatbot configuration
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('*')
      .eq('id', chatbotId)
      .single();

    if (chatbotError) {
      console.error('Error fetching chatbot:', chatbotError);
      throw new Error('Chatbot not found');
    }

    // Get or create chat session
    let session;
    if (sessionId) {
      const { data } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = data;
    }

    if (!session) {
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert([{
          chatbot_id: chatbotId,
          status: 'active'
        }])
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        throw new Error('Failed to create chat session');
      }
      session = newSession;
    }

    // Track message_sent event
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const origin = req.headers.get('origin') || req.headers.get('referer') || 'unknown';

    await supabase
      .from('chatbot_events')
      .insert({
        chatbot_id: chatbotId,
        session_id: session.id,
        event_type: 'message_sent',
        event_data: { 
          message_length: message.length,
          origin: origin 
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    // Save user message to database
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert([{
        session_id: session.id,
        role: 'user',
        content: message
      }]);

    if (messageError) {
      console.error('Error saving message:', messageError);
    }

    // Get conversation history for context
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    // Get knowledge sources for context
    const { data: knowledgeSources } = await supabase
      .from('knowledge_sources')
      .select('content, name')
      .eq('chatbot_id', chatbotId)
      .eq('status', 'completed');

    // Get FAQs for context
    const { data: faqs } = await supabase
      .from('chatbot_faqs')
      .select('question, answer')
      .eq('chatbot_id', chatbotId)
      .order('order_index', { ascending: true });

    // Build context from knowledge sources
    let contextContent = '';
    if (knowledgeSources && knowledgeSources.length > 0) {
      contextContent = knowledgeSources
        .map(source => `${source.name}: ${source.content}`)
        .join('\n\n');
    }

    // Add FAQ context
    if (faqs && faqs.length > 0) {
      const faqContent = faqs
        .map(faq => `Q: ${faq.question}\nA: ${faq.answer}`)
        .join('\n\n');
      contextContent += contextContent ? `\n\n--- Frequently Asked Questions ---\n${faqContent}` : faqContent;
    }

    // Add widget configuration context (contact info, donations)
    const widgetConfig = chatbot.web_widget_config || {};
    let additionalContext = '';
    
    if (widgetConfig.email_contact || widgetConfig.phone_contact) {
      additionalContext += '\n\n--- Contact Information ---\n';
      if (widgetConfig.email_contact) {
        additionalContext += `Email: ${widgetConfig.email_contact}\n`;
      }
      if (widgetConfig.phone_contact) {
        additionalContext += `Phone: ${widgetConfig.phone_contact}\n`;
      }
    }
    
    if (widgetConfig.show_donations && (widgetConfig.donation_button_1 || widgetConfig.donation_button_2)) {
      additionalContext += '\n\n--- Donation Options ---\n';
      if (widgetConfig.donation_button_1) {
        additionalContext += `${widgetConfig.donation_button_1.label}: ${widgetConfig.donation_button_1.url}\n`;
      }
      if (widgetConfig.donation_button_2) {
        additionalContext += `${widgetConfig.donation_button_2.label}: ${widgetConfig.donation_button_2.url}\n`;
      }
    }
    
    contextContent += additionalContext;

    // Prepare OpenAI messages
    const systemPrompt = chatbot.description || 'You are a helpful AI assistant.';
    const openAIMessages = [
      { 
        role: 'system', 
        content: `${systemPrompt}\n\nContext from knowledge base:\n${contextContent}` 
      },
      ...(messages || []).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Call OpenAI API
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
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

    // Save assistant response to database
    const { error: assistantMessageError } = await supabase
      .from('chat_messages')
      .insert([{
        session_id: session.id,
        role: 'assistant',
        content: assistantMessage
      }]);

    if (assistantMessageError) {
      console.error('Error saving assistant message:', assistantMessageError);
    }

    // Track message_answered event
    await supabase
      .from('chatbot_events')
      .insert({
        chatbot_id: chatbotId,
        session_id: session.id,
        event_type: 'message_answered',
        event_data: { 
          response_length: assistantMessage.length,
          model_used: 'gpt-4o-mini'
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    return new Response(JSON.stringify({ 
      message: assistantMessage, 
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-handler:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});