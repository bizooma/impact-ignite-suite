import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PROVISION-ORG] ${step}${d}`);
};

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || `org-${Math.random().toString(36).slice(2, 8)}`
  );
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
    const metaOrgName = (claims.claims.user_metadata as any)?.organization_name as string | undefined;

    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      /* no-op: body optional */
    }
    const organizationName = (body?.organizationName ?? metaOrgName ?? "").toString().trim();
    if (!organizationName || organizationName.length < 2) {
      throw new Error("organizationName required");
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    log("provisioning", { userId, organizationName });

    // Idempotent: if user already owns any org, return it.
    const { data: existing } = await admin
      .from("memberships")
      .select("organization_id")
      .eq("user_id", userId)
      .eq("role", "owner")
      .limit(1);

    if (existing && existing.length > 0) {
      log("already owns org", { orgId: existing[0].organization_id });
      // Clear pending metadata regardless
      await admin.auth.admin.updateUserById(userId, { user_metadata: { organization_name: null } });
      return new Response(
        JSON.stringify({ organizationId: existing[0].organization_id, alreadyExisted: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // Unique slug with collision retry
    const baseSlug = slugify(organizationName);
    let slug = baseSlug;
    for (let i = 0; i < 5; i++) {
      const { data: clash } = await admin
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!clash) break;
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`;
    }

    const { data: newOrg, error: orgErr } = await admin
      .from("organizations")
      .insert({ name: organizationName, slug })
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

    // Clear pending metadata so this won't run again
    await admin.auth.admin.updateUserById(userId, { user_metadata: { organization_name: null } });

    return new Response(
      JSON.stringify({ organizationId: newOrg.id, alreadyExisted: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
