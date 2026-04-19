// Shared helper for mobile app edge functions: authenticate via x-mobile-api-key header.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mobile-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// Naive in-memory rate limit per API key (per cold-start instance).
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;

export function rateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  bucket.count++;
  return bucket.count <= MAX_PER_WINDOW;
}

export interface MobileAuthResult {
  organizationId: string;
  apiKey: string;
}

export async function authenticateMobileRequest(
  req: Request,
  supabase: SupabaseClient
): Promise<{ ok: true; data: MobileAuthResult } | { ok: false; response: Response }> {
  const apiKey = req.headers.get('x-mobile-api-key');
  if (!apiKey) {
    return { ok: false, response: jsonResponse({ error: 'Missing x-mobile-api-key header' }, 401) };
  }

  if (!rateLimit(apiKey)) {
    return { ok: false, response: jsonResponse({ error: 'Rate limit exceeded' }, 429) };
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id, mobile_api_enabled')
    .eq('mobile_api_key', apiKey)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, response: jsonResponse({ error: 'Invalid API key' }, 401) };
  }
  if (!data.mobile_api_enabled) {
    return { ok: false, response: jsonResponse({ error: 'Mobile API disabled for this organization' }, 403) };
  }

  return { ok: true, data: { organizationId: data.id, apiKey } };
}
