import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import {
  corsHeaders,
  jsonResponse,
  getServiceClient,
  authenticateMobileRequest,
} from "../_shared/mobile-auth.ts";

const DonateSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  currency: z.string().length(3).optional().default('USD'),
  email: z.string().trim().email().max(255),
  first_name: z.string().trim().max(100).optional().nullable(),
  last_name: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  is_recurring: z.boolean().optional().default(false),
  recurrence_frequency: z.string().optional().nullable(),
  campaign_id: z.string().uuid().optional().nullable(),
  payment_method: z.string().max(50).optional().default('mobile_app'),
  transaction_id: z.string().max(255).optional().nullable(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabase = getServiceClient();
  const auth = await authenticateMobileRequest(req, supabase);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const parsed = DonateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }
  const input = parsed.data;
  const orgId = auth.data.organizationId;
  const email = input.email.toLowerCase();

  // Find or create contact (match by email within org)
  let contactId: string | null = null;
  const { data: existing } = await supabase
    .from('crm_contacts')
    .select('id')
    .eq('organization_id', orgId)
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    contactId = existing.id;
    // Best-effort update of name/phone if provided
    if (input.first_name || input.last_name || input.phone) {
      await supabase
        .from('crm_contacts')
        .update({
          first_name: input.first_name ?? undefined,
          last_name: input.last_name ?? undefined,
          phone: input.phone ?? undefined,
          last_interaction_at: new Date().toISOString(),
        })
        .eq('id', contactId);
    }
  } else {
    const { data: created, error: cErr } = await supabase
      .from('crm_contacts')
      .insert({
        organization_id: orgId,
        email,
        first_name: input.first_name ?? null,
        last_name: input.last_name ?? null,
        phone: input.phone ?? null,
        contact_type: 'individual',
        source: 'mobile_app',
        lifecycle_stage: 'donor',
        last_interaction_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (cErr) return jsonResponse({ error: cErr.message }, 500);
    contactId = created.id;
  }

  const { data: donation, error: dErr } = await supabase
    .from('crm_donations')
    .insert({
      organization_id: orgId,
      contact_id: contactId!,
      amount: input.amount,
      currency: input.currency,
      donation_date: new Date().toISOString().slice(0, 10),
      payment_method: input.payment_method,
      transaction_id: input.transaction_id ?? null,
      is_recurring: input.is_recurring,
      recurrence_frequency: input.recurrence_frequency ?? null,
      notes: input.notes ?? null,
      campaign_id: input.campaign_id ?? null,
      metadata: { source: 'mobile_app' },
    })
    .select('id')
    .single();

  if (dErr) return jsonResponse({ error: dErr.message }, 500);

  // Log interaction
  await supabase.from('crm_interactions').insert({
    organization_id: orgId,
    contact_id: contactId!,
    interaction_type: 'donation',
    subject: `Mobile app donation: ${input.currency} ${input.amount}`,
    source_module: 'mobile_app',
    source_id: donation.id,
  });

  return jsonResponse({
    success: true,
    donation_id: donation.id,
    contact_id: contactId,
    status: 'recorded',
    note: 'Donation recorded as pending. Confirm via CRM or wire payment processor.',
  });
});
