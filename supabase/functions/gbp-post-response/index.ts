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
    const { reviewId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get review with integration details
    const { data: review, error: reviewError } = await supabaseClient
      .from('gbp_reviews')
      .select(`
        *,
        gbp_profiles (
          id,
          profile_data,
          organization_id
        )
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      throw new Error('Review not found');
    }

    // Get Google Business integration for this org
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('organization_id', review.gbp_profiles.organization_id)
      .eq('provider', 'google_business')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      throw new Error('No active Google Business integration found');
    }

    const tokens = integration.encrypted_tokens as any;
    let accessToken = tokens.access_token;

    // Check if token needs refresh
    if (new Date(tokens.expires_at) <= new Date()) {
      accessToken = await refreshAccessToken(supabaseClient, integration);
    }

    const accountId = review.gbp_profiles.profile_data?.accountId;
    const locationId = review.gbp_profiles.profile_data?.locationId;
    const googleReviewId = review.google_review_id;

    if (!accountId || !locationId || !googleReviewId) {
      throw new Error('Missing required Google Business Profile data');
    }

    // Post reply to Google
    const replyUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${googleReviewId}/reply`;
    
    const replyResponse = await fetch(replyUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: review.final_response || review.ai_generated_response,
      }),
    });

    if (!replyResponse.ok) {
      const error = await replyResponse.text();
      console.error('Failed to post reply:', error);
      throw new Error('Failed to post reply to Google');
    }

    const replyData = await replyResponse.json();

    // Update review status
    await supabaseClient
      .from('gbp_reviews')
      .update({
        reply_status: 'posted',
        posted_at: new Date().toISOString(),
        google_reply_id: replyData.name,
      })
      .eq('id', reviewId);

    console.log(`Reply posted successfully for review ${reviewId}`);

    return new Response(
      JSON.stringify({ success: true, replyId: replyData.name }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Post response error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Update review to show error
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { reviewId } = await req.json().catch(() => ({}));
    if (reviewId) {
      await supabaseClient
        .from('gbp_reviews')
        .update({
          metadata: { error: errorMessage },
        })
        .eq('id', reviewId);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function refreshAccessToken(supabaseClient: any, integration: any): Promise<string> {
  const tokens = integration.encrypted_tokens as any;
  
  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: tokens.client_id,
      client_secret: tokens.client_secret,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!refreshResponse.ok) {
    throw new Error('Failed to refresh access token');
  }

  const refreshData = await refreshResponse.json();

  await supabaseClient
    .from('integrations')
    .update({
      encrypted_tokens: {
        ...tokens,
        access_token: refreshData.access_token,
        expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
      },
    })
    .eq('id', integration.id);

  return refreshData.access_token;
}
