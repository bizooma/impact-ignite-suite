import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import {
  corsHeaders,
  jsonResponse,
  getServiceClient,
  authenticateMobileRequest,
} from "../_shared/mobile-auth.ts";

const VolunteerSchema = z.object({
  email: z.string().trim().email().max(255),
  first_name: z.string().trim().max(100).optional().nullable(),
  last_name: z.string().trim().max(100).optional().nullable(),
  name: z.string().trim().max(200).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  hours: z.number().nonnegative().max(10000).optional().default(0),
  activity: z.string().trim().min(1).max(255),
  volunteer_date: z.string().optional(),
  location: z.string().trim().max(255).optional().nullable(),
  supervisor: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  days: z.array(z.string()).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabase = getServiceClient();
  const auth = await authenticateMobileRequest(req, supabase);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const parsed = VolunteerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }
  const input = parsed.data;
  const orgId = auth.data.organizationId;
  const email = input.email.toLowerCase();

  // Split name fallback
  let firstName = input.first_name ?? null;
  let lastName = input.last_name ?? null;
  if (!firstName && !lastName && input.name) {
    const parts = input.name.trim().split(/\s+/);
    firstName = parts[0] ?? null;
    lastName = parts.slice(1).join(' ') || null;
  }

  // Find or create contact
  let contactId: string;
  const { data: existing } = await supabase
    .from('crm_contacts')
    .select('id')
    .eq('organization_id', orgId)
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    contactId = existing.id;
    await supabase
      .from('crm_contacts')
      .update({
        first_name: firstName ?? undefined,
        last_name: lastName ?? undefined,
        phone: input.phone ?? undefined,
        last_interaction_at: new Date().toISOString(),
      })
      .eq('id', contactId);
  } else {
    const { data: created, error: cErr } = await supabase
      .from('crm_contacts')
      .insert({
        organization_id: orgId,
        email,
        first_name: firstName,
        last_name: lastName,
        phone: input.phone ?? null,
        contact_type: 'individual',
        source: 'mobile_app',
        lifecycle_stage: 'volunteer',
        custom_fields: input.days ? { available_days: input.days } : {},
        last_interaction_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (cErr) return jsonResponse({ error: cErr.message }, 500);
    contactId = created.id;
  }

  // Record volunteer hours (even if 0 — represents a sign-up / activity record)
  const { data: hoursRow, error: hErr } = await supabase
    .from('crm_volunteer_hours')
    .insert({
      organization_id: orgId,
      contact_id: contactId,
      activity: input.activity,
      hours: input.hours,
      volunteer_date: input.volunteer_date ?? new Date().toISOString().slice(0, 10),
      location: input.location ?? null,
      supervisor: input.supervisor ?? null,
      notes: input.notes ?? null,
    })
    .select('id')
    .single();

  if (hErr) return jsonResponse({ error: hErr.message }, 500);

  await supabase.from('crm_interactions').insert({
    organization_id: orgId,
    contact_id: contactId,
    interaction_type: 'volunteer',
    subject: `Mobile volunteer: ${input.activity}`,
    source_module: 'mobile_app',
    source_id: hoursRow.id,
  });

  return jsonResponse({
    success: true,
    contact_id: contactId,
    volunteer_hours_id: hoursRow.id,
  });
});
