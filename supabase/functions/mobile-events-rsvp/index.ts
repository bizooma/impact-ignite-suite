import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import {
  corsHeaders,
  jsonResponse,
  getServiceClient,
  authenticateMobileRequest,
} from "../_shared/mobile-auth.ts";

const RsvpSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().nullable(),
  guests: z.number().int().min(1).max(20).optional().default(1),
  notes: z.string().trim().max(1000).optional().nullable(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabase = getServiceClient();
  const auth = await authenticateMobileRequest(req, supabase);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const parsed = RsvpSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }
  const input = parsed.data;

  // Verify event belongs to this org
  const { data: event, error: evErr } = await supabase
    .from('org_events')
    .select('id, organization_id, is_published')
    .eq('id', input.event_id)
    .maybeSingle();
  if (evErr) return jsonResponse({ error: evErr.message }, 500);
  if (!event || event.organization_id !== auth.data.organizationId || !event.is_published) {
    return jsonResponse({ error: 'Event not found' }, 404);
  }

  const { data, error } = await supabase
    .from('org_event_rsvps')
    .insert({
      event_id: input.event_id,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone ?? null,
      guests: input.guests,
      notes: input.notes ?? null,
    })
    .select('id')
    .single();

  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({ success: true, rsvp_id: data.id });
});
