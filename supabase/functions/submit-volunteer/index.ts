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
    const { name, email, phone, days, chatbotId, publicKey } = await req.json();

    // Validate required fields
    if (!name || !email || !chatbotId) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and chatbot ID are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
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

    // Save volunteer submission
    const { data: volunteer, error: volunteerError } = await supabase
      .from('volunteers')
      .insert({
        chatbot_id: chatbotId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        days: days || [],
        public_key: publicKey || null,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (volunteerError) {
      console.error('Error saving volunteer:', volunteerError);
      throw volunteerError;
    }

    // Track volunteer submission event
    const { error: eventError } = await supabase
      .from('chatbot_events')
      .insert({
        chatbot_id: chatbotId,
        event_type: 'volunteer_submitted',
        event_data: {
          volunteer_id: volunteer.id,
          days_count: days?.length || 0,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (eventError) {
      console.error('Error tracking event:', eventError);
      // Don't fail the request if event tracking fails
    }

    console.log('Volunteer submission successful:', volunteer.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Thank you for volunteering!',
        volunteer_id: volunteer.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in submit-volunteer function:', error);
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