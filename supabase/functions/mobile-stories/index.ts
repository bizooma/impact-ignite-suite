import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  jsonResponse,
  getServiceClient,
  authenticateMobileRequest,
} from "../_shared/mobile-auth.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabase = getServiceClient();
  const auth = await authenticateMobileRequest(req, supabase);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const featured = url.searchParams.get('featured');
  const slug = url.searchParams.get('slug');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);

  let query = supabase
    .from('org_success_stories')
    .select('id, title, slug, summary, body, hero_image_url, gallery, video_url, category, tags, author_name, is_featured, published_at')
    .eq('organization_id', auth.data.organizationId)
    .eq('is_published', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (featured === 'true') query = query.eq('is_featured', true);
  if (slug) query = query.eq('slug', slug);

  const { data, error } = await query;
  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({ stories: data });
});
