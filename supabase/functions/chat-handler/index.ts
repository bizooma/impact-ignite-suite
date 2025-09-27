import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, chatbotId } = await req.json();
    console.log('Processing chat message:', { sessionId, chatbotId, messageLength: message?.length });

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
      .eq('status', 'processed');

    // Build context from knowledge sources
    let contextContent = '';
    if (knowledgeSources && knowledgeSources.length > 0) {
      contextContent = knowledgeSources
        .map(source => `${source.name}: ${source.content}`)
        .join('\n\n');
    }

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