import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  action: "save" | "test" | "delete" | "status";
  organizationId: string;
  apiKey?: string;
}

function maskKey(key: string): string {
  if (!key || key.length < 12) return "••••";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth client — verifies the JWT
    const authClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Service client — bypasses RLS for integrations writes
    const supabase = createClient(supabaseUrl, supabaseService);

    const body = (await req.json()) as Body;
    const { action, organizationId } = body;
    if (!organizationId) {
      return new Response(JSON.stringify({ error: "organizationId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorize: must be admin/owner of the org
    const { data: membership } = await supabase
      .from("memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!membership || !["admin", "owner"].includes(membership.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      const { data: row } = await supabase
        .from("integrations")
        .select("id, status, updated_at, encrypted_tokens")
        .eq("organization_id", organizationId)
        .eq("provider", "openai")
        .maybeSingle();

      const apiKey = (row?.encrypted_tokens as any)?.api_key as string | undefined;
      return new Response(
        JSON.stringify({
          configured: !!apiKey,
          status: row?.status ?? "inactive",
          masked: apiKey ? maskKey(apiKey) : null,
          updated_at: row?.updated_at ?? null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "test") {
      const key = body.apiKey;
      if (!key) {
        return new Response(JSON.stringify({ error: "apiKey required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) {
        const txt = await res.text();
        return new Response(
          JSON.stringify({ ok: false, error: `OpenAI: ${res.status} ${txt.slice(0, 200)}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save") {
      const key = body.apiKey?.trim();
      if (!key || !key.startsWith("sk-")) {
        return new Response(
          JSON.stringify({ error: "Invalid OpenAI key (must start with sk-)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Verify key works
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) {
        const txt = await res.text();
        return new Response(
          JSON.stringify({ error: `Key rejected by OpenAI: ${res.status} ${txt.slice(0, 200)}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { data: existing } = await supabase
        .from("integrations")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("provider", "openai")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("integrations")
          .update({
            encrypted_tokens: { api_key: key },
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("integrations").insert({
          organization_id: organizationId,
          provider: "openai",
          name: "OpenAI (BYO Key)",
          encrypted_tokens: { api_key: key },
          status: "active",
        });
      }

      return new Response(
        JSON.stringify({ ok: true, masked: maskKey(key) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "delete") {
      await supabase
        .from("integrations")
        .delete()
        .eq("organization_id", organizationId)
        .eq("provider", "openai");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("org-openai-key-settings error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
