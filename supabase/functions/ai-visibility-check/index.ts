import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODELS = [
  { id: "openai/gpt-5-mini", platform: "openai" },
  { id: "google/gemini-2.5-flash", platform: "gemini" },
];
const MAX_PROMPTS = 20;

async function callAI(prompt: string, model: string, retries = 3): Promise<string> {
  const KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!KEY) throw new Error("LOVABLE_API_KEY not configured");
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.3 }),
    });
    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      if (content.trim()) return content;
    } else if (res.status === 402) {
      throw new Error("AI credits depleted");
    } else if (res.status !== 429 && res.status < 500) {
      throw new Error(`AI API failed: ${res.status}`);
    }
    await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
  }
  throw new Error("AI call failed after retries");
}

function extractDomains(text: string): string[] {
  const matches = text.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi) || [];
  return [...new Set(matches.map((d) => d.toLowerCase().replace(/^www\./, "")))];
}

function analyze(response: string, domain: string, prompt: string, platform: string) {
  const clean = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
  const esc = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const domainRe = new RegExp(esc, "i");
  const competitors = extractDomains(response).filter((d) => !d.includes(clean) && !clean.includes(d));
  const mentioned = domainRe.test(response);
  const isCitation = new RegExp(`https?:\\/\\/[^\\s)]*${esc}`, "i").test(response);
  const sentence = response.split(/[.!?]+/).find((s) => domainRe.test(s)) ?? "";
  return {
    platform,
    prompt,
    hasMention: mentioned,
    isCitation,
    confidence: mentioned ? (isCitation ? 1.0 : 0.8) : 0,
    mentionText: (mentioned ? sentence : response).trim().slice(0, 500),
    competitors: competitors.slice(0, 10),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { domain, prompts } = await req.json();
    if (!domain || !Array.isArray(prompts) || prompts.length === 0) throw new Error("domain and prompts[] are required");
    const limited = prompts.slice(0, MAX_PROMPTS);

    const results = [];
    for (const p of limited) {
      for (const m of MODELS) {
        try {
          const ask = `Answer this question as you normally would for a real user: "${p}". Where relevant, recommend specific companies, websites, or providers by name.`;
          results.push(analyze(await callAI(ask, m.id), domain, p, m.platform));
        } catch (e) {
          console.error(`Error ${m.platform} / "${p}":`, e);
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    const total = results.length;
    const mention_count = results.filter((r) => r.hasMention).length;
    const citation_count = results.filter((r) => r.isCitation).length;
    const overall_score = total > 0 ? Math.round((mention_count / total) * 100) : 0;

    const { data: run } = await supabase.from("ai_visibility_runs").insert({
      user_id: user.id, domain, prompts: limited,
      platforms: MODELS.map((m) => m.platform),
      total_checks: total, mention_count, citation_count, overall_score,
    }).select().single();

    if (run) {
      await supabase.from("ai_visibility_results").insert(
        results.map((r) => ({
          run_id: run.id, platform: r.platform, prompt: r.prompt,
          has_mention: r.hasMention, is_citation: r.isCitation,
          confidence: r.confidence, mention_text: r.mentionText, competitors: r.competitors,
        }))
      );
    }

    return new Response(JSON.stringify({ success: true, run_id: run?.id ?? null, domain, overall_score, total_checks: total, mention_count, citation_count, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
