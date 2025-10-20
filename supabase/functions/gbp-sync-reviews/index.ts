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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting GBP reviews sync...');

    // Get all active Google Business Profile integrations
    const { data: integrations, error: integrationsError } = await supabaseClient
      .from('integrations')
      .select('*, organizations(id, name)')
      .eq('provider', 'google_business')
      .eq('status', 'active');

    if (integrationsError) {
      throw integrationsError;
    }

    console.log(`Found ${integrations?.length || 0} active GBP integrations`);

    for (const integration of integrations || []) {
      try {
        await syncIntegrationReviews(supabaseClient, integration);
      } catch (error) {
        console.error(`Error syncing integration ${integration.id}:`, error);
        // Continue with other integrations
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced: integrations?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function syncIntegrationReviews(supabaseClient: any, integration: any) {
  const tokens = integration.encrypted_tokens as any;
  let accessToken = tokens.access_token;

  // Check if token needs refresh
  if (new Date(tokens.expires_at) <= new Date()) {
    accessToken = await refreshAccessToken(supabaseClient, integration);
  }

  // Get GBP profiles for this organization
  const { data: gbpProfiles, error: profilesError } = await supabaseClient
    .from('gbp_profiles')
    .select('*')
    .eq('organization_id', integration.organization_id);

  if (profilesError || !gbpProfiles?.length) {
    console.log(`No GBP profiles found for org ${integration.organization_id}`);
    return;
  }

  for (const profile of gbpProfiles) {
    const accountId = profile.profile_data?.accountId;
    const locationId = profile.profile_data?.locationId;

    if (!accountId || !locationId) {
      console.log(`Missing account/location ID for profile ${profile.id}`);
      continue;
    }

    // Fetch reviews from Google
    const reviewsUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`;
    
    const response = await fetch(reviewsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch reviews: ${response.statusText}`);
      continue;
    }

    const data = await response.json();
    const reviews = data.reviews || [];

    console.log(`Found ${reviews.length} reviews for profile ${profile.id}`);

    // Process each review
    for (const review of reviews) {
      await processReview(supabaseClient, review, profile, integration.organization_id);
    }
  }
}

async function processReview(supabaseClient: any, review: any, profile: any, organizationId: string) {
  const reviewId = review.reviewId || review.name?.split('/').pop();
  
  // Check if review already exists
  const { data: existingReview } = await supabaseClient
    .from('gbp_reviews')
    .select('id, reply_status')
    .eq('google_review_id', reviewId)
    .single();

  if (existingReview) {
    // Review exists, check if it needs updating
    return;
  }

  // Insert new review
  const { data: newReview, error: insertError } = await supabaseClient
    .from('gbp_reviews')
    .insert({
      gbp_profile_id: profile.id,
      organization_id: organizationId,
      google_review_id: reviewId,
      reviewer_name: review.reviewer?.displayName || 'Anonymous',
      reviewer_photo_url: review.reviewer?.profilePhotoUrl,
      rating: review.starRating === 'FIVE' ? 5 : 
              review.starRating === 'FOUR' ? 4 :
              review.starRating === 'THREE' ? 3 :
              review.starRating === 'TWO' ? 2 : 1,
      review_text: review.comment || null,
      review_date: review.createTime,
      reply_status: 'pending_ai',
      metadata: review,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting review:', insertError);
    return;
  }

  console.log(`New review ${reviewId} inserted, triggering AI generation`);

  // Trigger AI response generation
  await supabaseClient.functions.invoke('gbp-generate-response', {
    body: { reviewId: newReview.id },
  });
}

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

  // Update integration with new token
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
