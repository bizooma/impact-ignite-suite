import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const url = new URL(req.url);
    const chatbotId = url.searchParams.get('chatbot_id');

    if (!chatbotId) {
      return new Response(
        JSON.stringify({ error: 'chatbot_id parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch chatbot configuration (only active chatbots for external widgets)
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('*')
      .eq('id', chatbotId)
      .eq('status', 'active')
      .single();

    if (chatbotError || !chatbot) {
      return new Response(
        JSON.stringify({ error: 'Chatbot not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch FAQs
    const { data: faqs, error: faqsError } = await supabase
      .from('chatbot_faqs')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .order('order_index', { ascending: true });

    if (faqsError) {
      console.error('Error fetching FAQs:', faqsError);
    }

    // Build configuration response
    const config = {
      chatbot: {
        id: chatbot.id,
        name: chatbot.name,
        description: chatbot.description,
        status: chatbot.status,
        brand_settings: chatbot.brand_settings,
        web_widget_config: chatbot.web_widget_config,
      },
      faqs: faqs || [],
    };

    return new Response(
      JSON.stringify(config),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        } 
      }
    );

  } catch (error) {
    console.error('Error in get-widget-config:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
