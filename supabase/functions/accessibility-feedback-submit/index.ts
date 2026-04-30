import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const siteId = String(body.site || '').trim();
    const message = String(body.message || '').trim();

    if (!siteId || !message) {
      return new Response(JSON.stringify({ error: 'site and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (message.length > 4000) {
      return new Response(JSON.stringify({ error: 'message too long' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: site, error: siteErr } = await admin
      .from('accessibility_sites')
      .select('id, is_active')
      .eq('site_id', siteId)
      .maybeSingle();

    if (siteErr || !site || !site.is_active) {
      return new Response(JSON.stringify({ error: 'unknown site' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const name = body.name ? String(body.name).trim().slice(0, 200) : null;
    const email = body.email ? String(body.email).trim().slice(0, 200) : null;
    const pageUrl = body.page_url ? String(body.page_url).trim().slice(0, 1000) : null;
    const userAgent = body.user_agent ? String(body.user_agent).trim().slice(0, 500) : null;

    const { error: insErr } = await admin.from('accessibility_feedback').insert({
      site_id: site.id,
      name,
      email,
      message,
      page_url: pageUrl,
      user_agent: userAgent,
    });

    if (insErr) {
      console.error('feedback insert error', insErr);
      return new Response(JSON.stringify({ error: 'could not save feedback' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('feedback handler error', e);
    return new Response(JSON.stringify({ error: 'server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
