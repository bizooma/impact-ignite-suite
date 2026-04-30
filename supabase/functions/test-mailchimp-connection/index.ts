import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Tests a Mailchimp integration and returns account info + audiences.
 *
 * The API key is fetched from Supabase Vault server-side — it is never
 * accepted from the client. The caller must be an admin/owner of the org.
 *
 * Body: { organizationId: string }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing auth' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Verify caller
    const authClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid auth' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const userId = userData.user.id;

    const { organizationId } = await req.json();
    if (!organizationId || typeof organizationId !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'organizationId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Service client for membership check + secret lookup
    const supabase = createClient(supabaseUrl, supabaseService);

    // Authorize: must be admin/owner of the org
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Pull the API key from Vault
    const { data: secret, error: secretErr } = await supabase.rpc(
      'get_integration_vault_secret_internal',
      { _org_id: organizationId, _provider: 'mailchimp' },
    );
    if (secretErr) {
      console.error('vault read failed:', secretErr);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to read integration secret' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const apiKey = (secret as string | null) ?? null;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'No Mailchimp API key configured for this organization' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const dc = apiKey.split('-')[1];
    if (!dc) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Mailchimp API key format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('Testing Mailchimp connection for datacenter:', dc);

    const pingResponse = await fetch(`https://${dc}.api.mailchimp.com/3.0/ping`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!pingResponse.ok) {
      const error = await pingResponse.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to connect to Mailchimp');
    }

    const accountResponse = await fetch(`https://${dc}.api.mailchimp.com/3.0/`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!accountResponse.ok) {
      const error = await accountResponse.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to get account info');
    }
    const accountData = await accountResponse.json();

    const listsResponse = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists?count=100`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!listsResponse.ok) {
      const error = await listsResponse.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to get audiences');
    }
    const listsData = await listsResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        account: {
          name: accountData.account_name,
          email: accountData.email,
          username: accountData.username,
        },
        audiences: (listsData.lists || []).map((list: any) => ({
          id: list.id,
          name: list.name,
          member_count: list.stats?.member_count || 0,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('Connection test error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Internal error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
