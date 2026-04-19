import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { integrationId } = await req.json();
    if (!integrationId) throw new Error('integrationId is required');

    const { data: integration, error: fetchErr } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (fetchErr || !integration) {
      throw new Error(fetchErr?.message || 'Integration not found');
    }

    const provider = integration.provider;
    const tokens = (integration.encrypted_tokens || {}) as Record<string, any>;

    if (provider === 'mailchimp') {
      const apiKey = tokens.api_key;
      if (!apiKey) throw new Error('Missing api_key in integration tokens');

      const dc = String(apiKey).split('-')[1];
      if (!dc) throw new Error('Invalid Mailchimp API key format (expected key-us14)');

      const ping = await fetch(`https://${dc}.api.mailchimp.com/3.0/ping`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!ping.ok) {
        const err = await ping.json().catch(() => ({}));
        throw new Error(err.detail || `Mailchimp ping failed (${ping.status})`);
      }

      const account = await fetch(`https://${dc}.api.mailchimp.com/3.0/`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      }).then((r) => r.json()).catch(() => null);

      return new Response(
        JSON.stringify({
          success: true,
          provider,
          account: account ? { name: account.account_name, email: account.email } : null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        provider,
        error: `Test not implemented for provider "${provider}"`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('test-integration error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
