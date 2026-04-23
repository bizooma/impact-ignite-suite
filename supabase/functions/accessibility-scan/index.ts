import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Severity = 'low' | 'medium' | 'high';
type Category = 'image' | 'form' | 'heading' | 'structure' | 'link' | 'language' | 'contrast' | 'other';

interface Issue {
  category: Category;
  severity: Severity;
  description: string;
  recommendation: string;
  element_snippet?: string | null;
  page_url?: string | null;
}

const log = (m: string, d?: any) => console.log(`[a11y-scan] ${m}${d ? ' ' + JSON.stringify(d) : ''}`);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const siteId = body?.site_id;
    if (!siteId || typeof siteId !== 'string') return json({ error: 'site_id required' }, 400);

    // Verify caller has access via RLS
    const { data: site, error: siteErr } = await userClient
      .from('accessibility_sites')
      .select('id, domain, organization_id')
      .eq('id', siteId)
      .single();
    if (siteErr || !site) return json({ error: 'Site not found or access denied' }, 403);

    const cleanDomain = String(site.domain).replace(/^https?:\/\//, '').replace(/\/$/, '');
    const url = `https://${cleanDomain}`;
    log('fetching', { url });

    let html = '';
    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 AccessibilityScanner/1.0' },
        signal: AbortSignal.timeout(15000),
      });
      html = await resp.text();
    } catch (e) {
      return json({ error: `Could not fetch site: ${String(e)}` }, 200);
    }

    const issues = analyze(html, url);
    const score = computeScore(issues);
    const summary = summarize(issues);

    // Use service role to insert the scan results (caller already authorized above)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: scan, error: scanErr } = await adminClient
      .from('accessibility_scans')
      .insert({
        site_id: siteId,
        score,
        pages_scanned: 1,
        summary,
        status: 'completed',
      })
      .select()
      .single();
    if (scanErr) {
      log('scan insert failed', scanErr);
      return json({ error: scanErr.message }, 500);
    }

    if (issues.length > 0) {
      const rows = issues.map((i) => ({ scan_id: scan.id, ...i, page_url: i.page_url ?? url }));
      await adminClient.from('accessibility_issues').insert(rows);
    }

    return json({ success: true, scan_id: scan.id, score, issue_count: issues.length });
  } catch (e: any) {
    log('error', String(e));
    return json({ error: e?.message ?? String(e) }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function analyze(html: string, pageUrl: string): Issue[] {
  const issues: Issue[] = [];

  // Strip out comments to reduce noise
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, '');

  // 1. <img> missing or empty alt
  const imgRegex = /<img\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(cleaned)) !== null) {
    const tag = m[0];
    const altMatch = tag.match(/\balt\s*=\s*("([^"]*)"|'([^']*)')/i);
    const role = (tag.match(/\brole\s*=\s*"([^"]*)"/i)?.[1] || '').toLowerCase();
    const ariaHidden = /\baria-hidden\s*=\s*"true"/i.test(tag);
    if (role === 'presentation' || ariaHidden) continue;
    if (!altMatch) {
      issues.push({
        category: 'image',
        severity: 'medium',
        description: 'Image is missing an alt attribute.',
        recommendation: 'Add a descriptive alt attribute, or use alt="" for purely decorative images.',
        element_snippet: snippet(tag),
        page_url: pageUrl,
      });
    }
  }

  // 2. form inputs without labels / aria-label
  const inputRegex = /<(input|select|textarea)\b[^>]*>/gi;
  while ((m = inputRegex.exec(cleaned)) !== null) {
    const tag = m[0];
    const type = (tag.match(/\btype\s*=\s*"([^"]*)"/i)?.[1] || '').toLowerCase();
    if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset' || type === 'image') continue;
    const id = tag.match(/\bid\s*=\s*"([^"]*)"/i)?.[1];
    const ariaLabel = /\baria-label\s*=\s*"[^"]+"/i.test(tag);
    const ariaLabelledBy = /\baria-labelledby\s*=\s*"[^"]+"/i.test(tag);
    const title = /\btitle\s*=\s*"[^"]+"/i.test(tag);
    let hasLabel = ariaLabel || ariaLabelledBy || title;
    if (!hasLabel && id) {
      const labelRegex = new RegExp(`<label\\b[^>]*\\bfor\\s*=\\s*"${escape(id)}"`, 'i');
      hasLabel = labelRegex.test(cleaned);
    }
    if (!hasLabel) {
      issues.push({
        category: 'form',
        severity: 'high',
        description: 'Form field is missing an associated label.',
        recommendation: 'Add a <label for="..."> tied to the field, or include an aria-label attribute.',
        element_snippet: snippet(tag),
        page_url: pageUrl,
      });
    }
  }

  // 3. multiple <h1> or skipped heading levels
  const headings: number[] = [];
  const hRegex = /<h([1-6])\b[^>]*>/gi;
  while ((m = hRegex.exec(cleaned)) !== null) {
    headings.push(Number(m[1]));
  }
  const h1Count = headings.filter((h) => h === 1).length;
  if (h1Count === 0) {
    issues.push({
      category: 'heading',
      severity: 'medium',
      description: 'Page is missing an <h1> heading.',
      recommendation: 'Add a single, descriptive <h1> as the page’s main heading.',
      page_url: pageUrl,
    });
  } else if (h1Count > 1) {
    issues.push({
      category: 'heading',
      severity: 'low',
      description: `Page has ${h1Count} <h1> headings.`,
      recommendation: 'Use a single <h1> per page and structure other headings with <h2>–<h6>.',
      page_url: pageUrl,
    });
  }
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] - headings[i - 1] > 1) {
      issues.push({
        category: 'heading',
        severity: 'low',
        description: `Heading level skipped from h${headings[i - 1]} to h${headings[i]}.`,
        recommendation: 'Avoid skipping heading levels — use consecutive levels for an accessible outline.',
        page_url: pageUrl,
      });
      break;
    }
  }

  // 4. empty <a> and <button>
  const linkRegex = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = linkRegex.exec(cleaned)) !== null) {
    const inner = m[1].replace(/<[^>]+>/g, '').trim();
    const ariaLabel = /\baria-label\s*=\s*"[^"]+"/i.test(m[0]);
    if (!inner && !ariaLabel) {
      issues.push({
        category: 'link',
        severity: 'medium',
        description: 'Link has no visible text or aria-label.',
        recommendation: 'Add visible link text or an aria-label that describes the link’s purpose.',
        element_snippet: snippet(m[0]),
        page_url: pageUrl,
      });
    }
  }
  const btnRegex = /<button\b[^>]*>([\s\S]*?)<\/button>/gi;
  while ((m = btnRegex.exec(cleaned)) !== null) {
    const inner = m[1].replace(/<[^>]+>/g, '').trim();
    const ariaLabel = /\baria-label\s*=\s*"[^"]+"/i.test(m[0]);
    if (!inner && !ariaLabel) {
      issues.push({
        category: 'link',
        severity: 'medium',
        description: 'Button has no accessible name.',
        recommendation: 'Add visible button text or an aria-label that describes the action.',
        element_snippet: snippet(m[0]),
        page_url: pageUrl,
      });
    }
  }

  // 5. <html lang="..."> missing
  const htmlTag = cleaned.match(/<html\b[^>]*>/i)?.[0] || '';
  if (!/\blang\s*=\s*"[^"]+"/i.test(htmlTag)) {
    issues.push({
      category: 'language',
      severity: 'medium',
      description: 'The <html> element is missing a lang attribute.',
      recommendation: 'Set a language with <html lang="en"> (or the appropriate language code).',
      page_url: pageUrl,
    });
  }

  // 6. <title> missing or empty
  const titleMatch = cleaned.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    issues.push({
      category: 'structure',
      severity: 'medium',
      description: 'Page has no <title> or the title is empty.',
      recommendation: 'Add a unique, descriptive <title> for every page.',
      page_url: pageUrl,
    });
  }

  return issues;
}

function snippet(s: string) {
  return s.length > 240 ? s.slice(0, 240) + '…' : s;
}
function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function computeScore(issues: Issue[]): number {
  const weights: Record<Severity, number> = { high: 15, medium: 7, low: 3 };
  const penalty = issues.reduce((acc, i) => acc + weights[i.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

function summarize(issues: Issue[]): Record<string, number> {
  return issues.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});
}
