import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PROVISION-BETA-ORG] ${step}${d}`);
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || `org-${Math.random().toString(36).slice(2, 8)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claims?.claims) throw new Error("Unauthorized");
    const userId = claims.claims.sub as string;
    const email = claims.claims.email as string | undefined;

    const { betaSignupId: providedSignupId, organizationName, displayName } = await req.json();
    if (!organizationName) throw new Error("organizationName required");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    log("provisioning", { userId, email, organizationName, providedSignupId });

    // Ensure a beta_signups row exists (server-side, bypasses RLS issues).
    let betaSignupId: string | null = providedSignupId ?? null;
    if (!betaSignupId && email) {
      const { data: existingSignup } = await admin
        .from("beta_signups")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (existingSignup) {
        betaSignupId = existingSignup.id;
        log("found existing beta signup", { betaSignupId });
      } else {
        const { data: newSignup, error: signupErr } = await admin
          .from("beta_signups")
          .insert({ email, name: displayName ?? null, organization: organizationName })
          .select("id")
          .single();
        if (signupErr) {
          log("beta_signups insert failed (non-fatal)", { err: signupErr.message });
        } else {
          betaSignupId = newSignup.id;
          log("beta signup created", { betaSignupId });
        }
      }
    }

    // Check if user already owns a beta org — idempotent
    const { data: existing } = await admin
      .from("memberships")
      .select("organization_id, organizations!inner(id, is_beta_org)")
      .eq("user_id", userId)
      .eq("role", "owner");

    const alreadyHasBeta = (existing || []).find((m: any) => m.organizations?.is_beta_org);
    if (alreadyHasBeta) {
      log("already has beta org", { orgId: alreadyHasBeta.organization_id });
      return new Response(JSON.stringify({ organizationId: alreadyHasBeta.organization_id, alreadyExisted: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const baseSlug = slugify(organizationName);
    let slug = baseSlug;
    for (let i = 0; i < 5; i++) {
      const { data: clash } = await admin.from("organizations").select("id").eq("slug", slug).maybeSingle();
      if (!clash) break;
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`;
    }

    // Beta orgs get every product unlocked so testers can try the full platform.
    // They stay on the "free" tier until they subscribe via the beta pricing page.
    const BETA_PRODUCTS = [
      "chatbots", "qr_codes", "social_media", "seo_audits", "analytics",
      "crm", "tasks", "google_business", "campaigns", "mobile_app",
    ];

    const { data: newOrg, error: orgErr } = await admin
      .from("organizations")
      .insert({
        name: organizationName,
        slug,
        is_beta_org: true,
        beta_signup_id: betaSignupId ?? null,
        subscription_tier: "free",
        purchased_products: BETA_PRODUCTS,
      })
      .select()
      .single();
    if (orgErr) throw orgErr;
    log("org created", { orgId: newOrg.id });

    const { error: memErr } = await admin.from("memberships").insert({
      user_id: userId,
      organization_id: newOrg.id,
      role: "owner",
    });
    if (memErr) throw memErr;
    log("membership created");

    return new Response(JSON.stringify({ organizationId: newOrg.id, alreadyExisted: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
