import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SaveBody {
  action: 'save' | 'test' | 'delete' | 'status';
  organization_id: string;
  secret_key?: string;
  publishable_key?: string;
  webhook_secret?: string;
}

function maskKey(key: string): string {
  if (!key || key.length < 12) return '••••';
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

async function testStripeKey(secretKey: string): Promise<{ ok: boolean; account?: any; error?: string }> {
  try {
    const res = await fetch('https://api.stripe.com/v1/account', {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.error?.message || `Stripe returned ${res.status}` };
    }
    const account = await res.json();
    return { ok: true, account: { id: account.id, email: account.email, business_profile: account.business_profile, country: account.country, livemode: !secretKey.startsWith('sk_test_') } };
  } catch (e: any) {
    return { ok: false, error: e.message || 'Network error contacting Stripe' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claims.claims.sub;

    const body: SaveBody = await req.json();
    const { action, organization_id } = body;

    if (!organization_id) {
      return new Response(JSON.stringify({ error: 'organization_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Service-role client to manage integrations table (RLS already gates by org admin, but we need to bypass for write ops based on our own check)
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Check user is an admin/owner of org
    const { data: membership } = await admin
      .from('memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', organization_id)
      .maybeSingle();

    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin/owner role required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'status') {
      const { data: existing } = await admin
        .from('integrations')
        .select('id, status, last_synced_at, encrypted_tokens, config')
        .eq('organization_id', organization_id)
        .eq('provider', 'stripe')
        .maybeSingle();

      if (!existing) {
        return new Response(JSON.stringify({ connected: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const tokens = (existing.encrypted_tokens || {}) as any;
      return new Response(JSON.stringify({
        connected: existing.status === 'active',
        status: existing.status,
        secret_key_preview: tokens.secret_key ? maskKey(tokens.secret_key) : null,
        publishable_key: tokens.publishable_key || null,
        webhook_secret_set: !!tokens.webhook_secret,
        livemode: tokens.livemode ?? null,
        account_id: tokens.account_id || null,
        account_email: tokens.account_email || null,
        last_verified_at: existing.last_synced_at,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete') {
      await admin.from('integrations').delete().eq('organization_id', organization_id).eq('provider', 'stripe');
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'test') {
      if (!body.secret_key) {
        return new Response(JSON.stringify({ error: 'secret_key required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const result = await testStripeKey(body.secret_key);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'save') {
      if (!body.secret_key || !body.secret_key.startsWith('sk_')) {
        return new Response(JSON.stringify({ error: 'A valid Stripe secret key (sk_...) is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      // Verify the key works before saving
      const test = await testStripeKey(body.secret_key);
      if (!test.ok) {
        return new Response(JSON.stringify({ error: `Stripe rejected the key: ${test.error}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const tokens = {
        secret_key: body.secret_key,
        publishable_key: body.publishable_key || null,
        webhook_secret: body.webhook_secret || null,
        account_id: test.account?.id,
        account_email: test.account?.email,
        livemode: test.account?.livemode,
      };

      const { data: existing } = await admin
        .from('integrations')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('provider', 'stripe')
        .maybeSingle();

      if (existing) {
        await admin.from('integrations').update({
          encrypted_tokens: tokens,
          status: 'active',
          last_synced_at: new Date().toISOString(),
        }).eq('id', existing.id);
      } else {
        await admin.from('integrations').insert({
          organization_id,
          provider: 'stripe',
          name: 'Stripe',
          encrypted_tokens: tokens,
          status: 'active',
          last_synced_at: new Date().toISOString(),
        });
      }

      return new Response(JSON.stringify({
        ok: true,
        account: test.account,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('stripe-connect-settings error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
