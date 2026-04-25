// Facebook OAuth — Step 1: generate consent URL for an organization admin
// Each organization connects their own Facebook Page(s) through this flow.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FB_API_VERSION = "v19.0";
const SCOPES = [
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
  "business_management",
].join(",");

// Sign a JSON payload with HMAC-SHA256 using the service role key as the
// shared secret. The callback endpoint verifies the same signature so a
// returning Facebook redirect cannot be tampered with.
async function signState(payload: Record<string, unknown>, secret: string): Promise<string> {
  const body = btoa(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${body}.${sigB64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FACEBOOK_APP_ID = Deno.env.get("FACEBOOK_APP_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!FACEBOOK_APP_ID) {
      return new Response(
        JSON.stringify({
          error:
            "Facebook integration not yet configured by platform admin. Missing FACEBOOK_APP_ID.",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const organizationId = body.organization_id;
    const returnTo = typeof body.return_to === "string" ? body.return_to : "/dashboard/social";

    if (!organizationId || typeof organizationId !== "string") {
      return new Response(
        JSON.stringify({ error: "organization_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify caller is admin/owner of this org
    const { data: isAdmin } = await supabase.rpc("has_org_role", {
      _user_id: user.id,
      _org_id: organizationId,
      _role: "admin",
    });
    const { data: isOwner } = await supabase.rpc("has_org_role", {
      _user_id: user.id,
      _org_id: organizationId,
      _role: "owner",
    });
    if (!isAdmin && !isOwner) {
      return new Response(
        JSON.stringify({
          error: "Only organization admins or owners can connect Facebook",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Build signed state (15 min validity)
    const nonce = crypto.randomUUID();
    const exp = Date.now() + 15 * 60 * 1000;
    const state = await signState(
      { org_id: organizationId, user_id: user.id, return_to: returnTo, nonce, exp },
      SERVICE_KEY,
    );

    const redirectUri =
      `${SUPABASE_URL}/functions/v1/facebook-oauth-callback`;
    const params = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      redirect_uri: redirectUri,
      state,
      scope: SCOPES,
      response_type: "code",
      auth_type: "rerequest",
    });
    const authorize_url =
      `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth?${params.toString()}`;

    return new Response(JSON.stringify({ authorize_url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[facebook-oauth-start]", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
