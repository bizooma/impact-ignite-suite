import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helpers to read/write GBP secrets via Supabase Vault.
// Sensitive fields (client_secret, access_token, refresh_token) are stored
// as a JSON blob in vault.secrets. Non-sensitive metadata (client_id,
// expires_at, scopes, etc.) remains in integrations.encrypted_tokens.
async function readVaultSecrets(client: any, orgId: string) {
  const { data, error } = await client.rpc('get_integration_vault_secret_internal', {
    _org_id: orgId,
    _provider: 'google_business',
  });
  if (error) throw error;
  if (!data) return {};
  try {
    return JSON.parse(data as string);
  } catch {
    return {};
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

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // Contains integrationId
    
    if (!code || !state) {
      throw new Error('Missing authorization code or state');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get integration details
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', state)
      .single();

    if (integrationError || !integration) {
      throw new Error('Integration not found');
    }

    const meta = (integration.encrypted_tokens || {}) as any;
    const vaultSecrets = await readVaultSecrets(supabaseClient, integration.organization_id);
    const clientId = meta.client_id;
    const clientSecret = vaultSecrets.client_secret;

    if (!clientId || !clientSecret) {
      throw new Error('OAuth client credentials not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/gbp-oauth-callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange authorization code');
    }

    const tokenData = await tokenResponse.json();

    // Persist new tokens to vault, keep only non-sensitive metadata in JSON column
    await writeVaultSecrets(supabaseClient, integration.organization_id, {
      client_secret: clientSecret,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    });

    const { error: updateError } = await supabaseClient
      .from('integrations')
      .update({
        encrypted_tokens: {
          client_id: clientId,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        },
        status: 'active',
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', state);

    if (updateError) {
      throw updateError;
    }

    // Redirect to success page
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${url.origin}/dashboard/integrations?success=true`,
      },
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
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
