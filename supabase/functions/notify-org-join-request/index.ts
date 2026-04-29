// Sends an email to an organization owner when someone requests to join the org
// via mobile app code. Uses the Resend connector via the Lovable connector gateway.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';

interface RequestBody {
  request_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ---- Auth: validate caller JWT ----
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const callerId = userData.user.id;

    // ---- Parse + validate body ----
    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }
    const requestId = body?.request_id;
    if (!requestId || typeof requestId !== 'string') {
      return json({ error: 'request_id is required' }, 400);
    }

    // ---- Load join request + verify caller is the requester ----
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: joinReq, error: reqErr } = await admin
      .from('org_join_requests')
      .select('id, organization_id, user_id, requested_email, status, created_at')
      .eq('id', requestId)
      .maybeSingle();

    if (reqErr || !joinReq) {
      return json({ error: 'Request not found' }, 404);
    }
    if (joinReq.user_id !== callerId) {
      return json({ error: 'Not authorized for this request' }, 403);
    }
    if (joinReq.status !== 'pending') {
      return json({ ok: true, skipped: 'request_not_pending' }, 200);
    }

    // ---- Look up org + owner email ----
    const { data: org, error: orgErr } = await admin
      .from('organizations')
      .select('id, name, owner_id')
      .eq('id', joinReq.organization_id)
      .maybeSingle();

    if (orgErr || !org) {
      return json({ error: 'Organization not found' }, 404);
    }

    if (!org.owner_id) {
      console.warn('No owner_id on organization', org.id);
      return json({ ok: true, skipped: 'no_owner' }, 200);
    }

    const { data: ownerUser, error: ownerErr } = await admin.auth.admin.getUserById(org.owner_id);
    if (ownerErr || !ownerUser?.user?.email) {
      console.warn('Owner email not found', org.owner_id, ownerErr);
      return json({ ok: true, skipped: 'owner_email_missing' }, 200);
    }
    const ownerEmail = ownerUser.user.email;

    // ---- Build email ----
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!LOVABLE_API_KEY) return json({ error: 'LOVABLE_API_KEY not configured' }, 500);
    if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY not configured' }, 500);

    const appOrigin =
      req.headers.get('origin') ||
      req.headers.get('referer')?.replace(/\/$/, '') ||
      'https://impact-ignite-suite.lovable.app';
    const reviewUrl = `${appOrigin.replace(/\/$/, '')}/members`;

    const subject = `New join request for ${org.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
        <h2 style="margin: 0 0 12px;">Someone wants to join ${escapeHtml(org.name)}</h2>
        <p style="margin: 0 0 16px; color: #444;">
          <strong>${escapeHtml(joinReq.requested_email || 'A user')}</strong>
          used your mobile app code to request access to your organization.
        </p>
        <p style="margin: 0 0 24px; color: #444;">
          They will not have access until you approve the request.
        </p>
        <a href="${reviewUrl}"
           style="display: inline-block; background: #16a34a; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Review request
        </a>
        <p style="margin: 32px 0 0; color: #888; font-size: 12px;">
          You're receiving this because you're the owner of ${escapeHtml(org.name)}.
        </p>
      </div>
    `;
    const text =
      `${joinReq.requested_email || 'A user'} requested to join ${org.name} via your mobile app code.\n\n` +
      `They have NOT been granted access. Approve or reject the request here:\n${reviewUrl}\n`;

    // ---- Send via Resend connector gateway ----
    const resendRes = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'CauseIO <noreply@notify.causeio.com>',
        to: [ownerEmail],
        subject,
        html,
        text,
      }),
    });

    const resendBody = await resendRes.json().catch(() => ({}));
    if (!resendRes.ok) {
      console.error('Resend send failed', resendRes.status, resendBody);
      return json(
        { error: 'Email send failed', status: resendRes.status, details: resendBody },
        502,
      );
    }

    return json({ ok: true, message_id: resendBody?.id ?? null }, 200);
  } catch (err) {
    console.error('notify-org-join-request error', err);
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: string): string {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
