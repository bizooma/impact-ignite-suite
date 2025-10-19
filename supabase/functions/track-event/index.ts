import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { chatbotId, sessionId, eventType, eventData = {} } = await req.json();

    // Validate required fields
    if (!chatbotId || !eventType) {
      return new Response(
        JSON.stringify({ error: 'Chatbot ID and event type are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client IP and user agent
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Save event
    const { data: event, error: eventError } = await supabase
      .from('chatbot_events')
      .insert({
        chatbot_id: chatbotId,
        session_id: sessionId || null,
        event_type: eventType,
        event_data: eventData,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error saving event:', eventError);
      throw eventError;
    }

    console.log(`Event tracked: ${eventType} for chatbot ${chatbotId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: event.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in track-event function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});