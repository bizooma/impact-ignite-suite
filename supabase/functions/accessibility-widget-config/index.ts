import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('site');
    if (!siteId) {
      return new Response(JSON.stringify({ error: 'site param required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: site } = await admin
      .from('accessibility_sites')
      .select('id, is_active')
      .eq('site_id', siteId)
      .maybeSingle();

    if (!site || !site.is_active) {
      return new Response(JSON.stringify({ active: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: settings } = await admin
      .from('accessibility_settings')
      .select('high_contrast, font_scaling, reduced_motion, spacing, highlight_links, widget_active')
      .eq('site_id', site.id)
      .maybeSingle();

    return new Response(JSON.stringify({
      active: settings?.widget_active ?? true,
      features: {
        high_contrast: settings?.high_contrast ?? true,
        font_scaling: settings?.font_scaling ?? true,
        reduced_motion: settings?.reduced_motion ?? true,
        spacing: settings?.spacing ?? true,
        highlight_links: settings?.highlight_links ?? true,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
