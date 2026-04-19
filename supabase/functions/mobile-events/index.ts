import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  jsonResponse,
  getServiceClient,
  authenticateMobileRequest,
} from "../_shared/mobile-auth.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabase = getServiceClient();
  const auth = await authenticateMobileRequest(req, supabase);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const includePast = url.searchParams.get('include_past') === 'true';
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);

  let query = supabase
    .from('org_events')
    .select('id, title, description, location, starts_at, ends_at, image_url, capacity')
    .eq('organization_id', auth.data.organizationId)
    .eq('is_published', true)
    .order('starts_at', { ascending: true })
    .limit(limit);

  if (!includePast) {
    query = query.gte('starts_at', new Date().toISOString());
  }

  const { data, error } = await query;
  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({ events: data });
});
