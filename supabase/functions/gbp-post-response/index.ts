import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Vault-backed secret helpers (see gbp-oauth-callback for the storage shape).
async function readVaultSecrets(client: any, orgId: string) {
  const { data, error } = await client.rpc('get_integration_vault_secret_internal', {
    _org_id: orgId,
    _provider: 'google_business',
  });
  if (error) throw error;
  if (!data) return {} as any;
  try {
    return JSON.parse(data as string);
  } catch {
    return {} as any;
  }
}

async function writeVaultSecrets(client: any, orgId: string, secrets: Record<string, unknown>) {
  const { error } = await client.rpc('set_integration_vault_secret', {
    _org_id: orgId,
    _provider: 'google_business',
    _secret: JSON.stringify(secrets),
  });
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let parsedBody: { reviewId?: string } = {};
  try {
    parsedBody = await req.json();
  } catch {
    parsedBody = {};
  }
  const { reviewId } = parsedBody;

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    if (!reviewId) {
      throw new Error('reviewId is required');
    }

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

    const meta = (integration.encrypted_tokens || {}) as any;
    const secrets = await readVaultSecrets(supabaseClient, integration.organization_id);
    let accessToken = secrets.access_token;

    if (!accessToken) {
      throw new Error('Missing access token for Google Business integration');
    }

    if (!meta.expires_at || new Date(meta.expires_at) <= new Date()) {
      accessToken = await refreshAccessToken(supabaseClient, integration, meta, secrets);
    }

    const accountId = review.gbp_profiles.profile_data?.accountId;
    const locationId = review.gbp_profiles.profile_data?.locationId;
    const googleReviewId = review.google_review_id;

    if (!accountId || !locationId || !googleReviewId) {
      throw new Error('Missing required Google Business Profile data');
    }

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

async function refreshAccessToken(
  supabaseClient: any,
  integration: any,
  meta: any,
  secrets: any
): Promise<string> {
  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: meta.client_id,
      client_secret: secrets.client_secret,
      refresh_token: secrets.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!refreshResponse.ok) {
    throw new Error('Failed to refresh access token');
  }

  const refreshData = await refreshResponse.json();

  await writeVaultSecrets(supabaseClient, integration.organization_id, {
    ...secrets,
    access_token: refreshData.access_token,
  });

  await supabaseClient
    .from('integrations')
    .update({
      encrypted_tokens: {
        ...meta,
        expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
      },
    })
    .eq('id', integration.id);

  return refreshData.access_token;
}
