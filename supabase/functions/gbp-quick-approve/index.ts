import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token'); // This is the review ID

    if (!token) {
      throw new Error('Invalid approval token');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get review
    const { data: review, error: reviewError } = await supabaseClient
      .from('gbp_reviews')
      .select('*')
      .eq('id', token)
      .single();

    if (reviewError || !review) {
      throw new Error('Review not found');
    }

    // Update status to approved
    await supabaseClient
      .from('gbp_reviews')
      .update({
        reply_status: 'approved',
        final_response: review.ai_generated_response,
      })
      .eq('id', token);

    // Trigger posting to Google
    await supabaseClient.functions.invoke('gbp-post-response', {
      body: { reviewId: token },
    });

    // Redirect to confirmation page
    const redirectUrl = `${url.origin}/dashboard/gbp?tab=reviews&approved=true`;
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });

  } catch (error) {
    console.error('Quick approve error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
