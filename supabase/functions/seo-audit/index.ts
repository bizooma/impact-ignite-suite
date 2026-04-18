import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const MAX_PAGES = 10;

const log = (step: string, details?: any) => {
  console.log(`[SEO-AUDIT] ${step}${details ? ' - ' + JSON.stringify(details) : ''}`);
};

interface Issue {
  page_url: string;
  category: 'technical' | 'content' | 'schema' | 'voice';
  issue_type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

interface PageData {
  url: string;
  html: string;
  markdown: string;
  metadata: any;
  statusCode: number;
  responseTime: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { domain } = await req.json();
    log("Starting audit", { domain, hasFirecrawl: !!FIRECRAWL_API_KEY });

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const baseUrl = `https://${cleanDomain}`;

    // 1. Discover pages via sitemap
    const urls = await discoverPages(baseUrl);
    log("Pages discovered", { count: urls.length });

    // 2. Check robots.txt once
    const robotsExists = await checkRobotsTxt(baseUrl);

    // 3. Fetch each page
    const pages: PageData[] = [];
    for (const url of urls) {
      try {
        const page = await fetchPage(url);
        if (page) pages.push(page);
      } catch (e) {
        log("Page fetch failed", { url, error: String(e) });
      }
    }
    log("Pages fetched", { count: pages.length });

    if (pages.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Could not fetch any pages from the domain',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // 4. Run categorized checks
    const issues: Issue[] = [];
    for (const page of pages) {
      issues.push(...runTechnicalChecks(page, robotsExists));
      issues.push(...runContentChecks(page));
      issues.push(...runSchemaChecks(page));
      issues.push(...runVoiceChecks(page));
    }

    // 5. Compute scores
    const scores = computeScores(issues, pages.length);
    log("Audit complete", { issues: issues.length, scores });

    return new Response(JSON.stringify({
      success: true,
      issues,
      pages_crawled: pages.length,
      ...scores,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { msg });
    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function discoverPages(baseUrl: string): Promise<string[]> {
  const urls = new Set<string>([baseUrl]);
  try {
    const res = await fetch(`${baseUrl}/sitemap.xml`, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const xml = await res.text();
      const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
      for (const m of matches) {
        const url = m.replace(/<\/?loc>/g, '').trim();
        if (url.startsWith('http')) urls.add(url);
        if (urls.size >= MAX_PAGES) break;
      }
    }
  } catch (e) {
    log("Sitemap fetch failed", { error: String(e) });
  }
  return Array.from(urls).slice(0, MAX_PAGES);
}

async function checkRobotsTxt(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/robots.txt`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchPage(url: string): Promise<PageData | null> {
  const start = Date.now();

  if (FIRECRAWL_API_KEY) {
    try {
      const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['html', 'markdown'],
          onlyMainContent: false,
        }),
        signal: AbortSignal.timeout(45000),
      });
      const data = await res.json();
      const responseTime = Date.now() - start;
      if (data.success && data.data) {
        return {
          url,
          html: data.data.html || data.data.rawHtml || '',
          markdown: data.data.markdown || '',
          metadata: data.data.metadata || {},
          statusCode: data.data.metadata?.statusCode || 200,
          responseTime,
        };
      }
    } catch (e) {
      log("Firecrawl failed, falling back to fetch", { url, error: String(e) });
    }
  }

  // Fallback: plain fetch
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const html = await res.text();
  return {
    url,
    html,
    markdown: '',
    metadata: {},
    statusCode: res.status,
    responseTime: Date.now() - start,
  };
}

function runTechnicalChecks(page: PageData, robotsExists: boolean): Issue[] {
  const issues: Issue[] = [];
  const { url, html, statusCode, responseTime } = page;

  if (statusCode >= 400) {
    issues.push({ page_url: url, category: 'technical', issue_type: 'http_error', severity: 'high',
      description: `Page returned HTTP ${statusCode}`, recommendation: 'Fix the server error or remove dead URL' });
  }
  if (responseTime > 3000) {
    issues.push({ page_url: url, category: 'technical', issue_type: 'slow_response', severity: 'high',
      description: `Slow response: ${responseTime}ms`, recommendation: 'Optimize images, enable caching, use CDN' });
  } else if (responseTime > 1500) {
    issues.push({ page_url: url, category: 'technical', issue_type: 'moderate_response', severity: 'medium',
      description: `Moderate response time: ${responseTime}ms`, recommendation: 'Consider performance optimizations' });
  }
  if (!url.startsWith('https://')) {
    issues.push({ page_url: url, category: 'technical', issue_type: 'no_https', severity: 'high',
      description: 'Page not served over HTTPS', recommendation: 'Enable HTTPS with a valid SSL certificate' });
  }
  if (!/<link[^>]+rel=["']canonical["']/i.test(html)) {
    issues.push({ page_url: url, category: 'technical', issue_type: 'missing_canonical', severity: 'medium',
      description: 'Missing canonical link tag', recommendation: 'Add <link rel="canonical"> to prevent duplicate content issues' });
  }
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) {
    issues.push({ page_url: url, category: 'technical', issue_type: 'missing_viewport', severity: 'high',
      description: 'Missing viewport meta tag', recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile' });
  }
  if (!robotsExists) {
    issues.push({ page_url: url, category: 'technical', issue_type: 'missing_robots', severity: 'low',
      description: 'No robots.txt found at site root', recommendation: 'Add a robots.txt file to control crawler access' });
  }
  const imgs = html.match(/<img[^>]*>/gi) || [];
  const noAlt = imgs.filter(i => !/\salt=/i.test(i)).length;
  if (noAlt > 0) {
    issues.push({ page_url: url, category: 'technical', issue_type: 'missing_alt', severity: 'medium',
      description: `${noAlt} of ${imgs.length} images missing alt attributes`, recommendation: 'Add descriptive alt text to all images' });
  }
  return issues;
}

function runContentChecks(page: PageData): Issue[] {
  const issues: Issue[] = [];
  const { url, html, markdown } = page;

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || '';
  if (!title) {
    issues.push({ page_url: url, category: 'content', issue_type: 'missing_title', severity: 'high',
      description: 'Missing <title> tag', recommendation: 'Add a unique, descriptive title (30-60 chars)' });
  } else if (title.length < 30) {
    issues.push({ page_url: url, category: 'content', issue_type: 'short_title', severity: 'medium',
      description: `Title too short (${title.length} chars)`, recommendation: 'Expand title to 30-60 characters' });
  } else if (title.length > 60) {
    issues.push({ page_url: url, category: 'content', issue_type: 'long_title', severity: 'low',
      description: `Title too long (${title.length} chars)`, recommendation: 'Shorten title to under 60 characters' });
  }

  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const desc = descMatch?.[1]?.trim() || '';
  if (!desc) {
    issues.push({ page_url: url, category: 'content', issue_type: 'missing_description', severity: 'high',
      description: 'Missing meta description', recommendation: 'Add a 120-160 char meta description' });
  } else if (desc.length < 120) {
    issues.push({ page_url: url, category: 'content', issue_type: 'short_description', severity: 'medium',
      description: `Meta description too short (${desc.length} chars)`, recommendation: 'Expand to 120-160 characters' });
  } else if (desc.length > 160) {
    issues.push({ page_url: url, category: 'content', issue_type: 'long_description', severity: 'low',
      description: `Meta description too long (${desc.length} chars)`, recommendation: 'Trim to 160 characters or fewer' });
  }

  const h1s = html.match(/<h1[^>]*>/gi) || [];
  if (h1s.length === 0) {
    issues.push({ page_url: url, category: 'content', issue_type: 'missing_h1', severity: 'high',
      description: 'Missing H1 tag', recommendation: 'Add exactly one H1 per page' });
  } else if (h1s.length > 1) {
    issues.push({ page_url: url, category: 'content', issue_type: 'multiple_h1', severity: 'medium',
      description: `${h1s.length} H1 tags found`, recommendation: 'Use only one H1 per page' });
  }

  const h2 = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3 = (html.match(/<h3[^>]*>/gi) || []).length;
  if (h3 > 0 && h2 === 0) {
    issues.push({ page_url: url, category: 'content', issue_type: 'heading_hierarchy', severity: 'low',
      description: 'H3 used without H2 (broken hierarchy)', recommendation: 'Maintain logical heading order: H1 → H2 → H3' });
  }

  const text = markdown || html.replace(/<[^>]+>/g, ' ');
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 300) {
    issues.push({ page_url: url, category: 'content', issue_type: 'thin_content', severity: 'medium',
      description: `Thin content: only ${wordCount} words`, recommendation: 'Aim for 300+ words of substantive content' });
  }

  return issues;
}

function runSchemaChecks(page: PageData): Issue[] {
  const issues: Issue[] = [];
  const { url, html } = page;

  const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  if (jsonLdMatches.length === 0) {
    issues.push({ page_url: url, category: 'schema', issue_type: 'no_jsonld', severity: 'high',
      description: 'No JSON-LD structured data found', recommendation: 'Add JSON-LD schema (Organization, WebSite, etc.)' });
  } else {
    const allSchema = jsonLdMatches.join(' ');
    const hasOrg = /"@type"\s*:\s*"(Organization|LocalBusiness)"/i.test(allSchema);
    const hasFaq = /"@type"\s*:\s*"FAQPage"/i.test(allSchema);
    const hasBreadcrumb = /"@type"\s*:\s*"BreadcrumbList"/i.test(allSchema);
    if (!hasOrg) {
      issues.push({ page_url: url, category: 'schema', issue_type: 'no_org_schema', severity: 'medium',
        description: 'No Organization or LocalBusiness schema', recommendation: 'Add Organization schema with name, logo, contact info' });
    }
    if (!hasBreadcrumb) {
      issues.push({ page_url: url, category: 'schema', issue_type: 'no_breadcrumb', severity: 'low',
        description: 'No BreadcrumbList schema', recommendation: 'Add BreadcrumbList for better SERP display' });
    }
    if (!hasFaq && /\?/.test(html.match(/<h[2-3][^>]*>([^<]+)<\/h[2-3]>/gi)?.join(' ') || '')) {
      issues.push({ page_url: url, category: 'schema', issue_type: 'no_faq_schema', severity: 'low',
        description: 'Question-style headings detected but no FAQPage schema', recommendation: 'Mark up FAQs with FAQPage schema' });
    }
  }

  if (!/<meta[^>]+property=["']og:title["']/i.test(html)) {
    issues.push({ page_url: url, category: 'schema', issue_type: 'no_og_title', severity: 'medium',
      description: 'Missing Open Graph title', recommendation: 'Add <meta property="og:title"> for social sharing' });
  }
  if (!/<meta[^>]+property=["']og:description["']/i.test(html)) {
    issues.push({ page_url: url, category: 'schema', issue_type: 'no_og_description', severity: 'medium',
      description: 'Missing Open Graph description', recommendation: 'Add <meta property="og:description">' });
  }
  if (!/<meta[^>]+property=["']og:image["']/i.test(html)) {
    issues.push({ page_url: url, category: 'schema', issue_type: 'no_og_image', severity: 'medium',
      description: 'Missing Open Graph image', recommendation: 'Add <meta property="og:image"> for social previews' });
  }
  if (!/<meta[^>]+name=["']twitter:card["']/i.test(html)) {
    issues.push({ page_url: url, category: 'schema', issue_type: 'no_twitter_card', severity: 'low',
      description: 'Missing Twitter Card meta', recommendation: 'Add <meta name="twitter:card" content="summary_large_image">' });
  }

  return issues;
}

function runVoiceChecks(page: PageData): Issue[] {
  const issues: Issue[] = [];
  const { url, html, markdown } = page;

  const headings = (html.match(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/gi) || [])
    .map(h => h.replace(/<[^>]+>/g, ''));
  const questionHeadings = headings.filter(h =>
    /^(who|what|when|where|why|how|can|is|are|do|does|should)\b/i.test(h.trim()) || h.includes('?')
  );

  if (questionHeadings.length === 0) {
    issues.push({ page_url: url, category: 'voice', issue_type: 'no_question_headings', severity: 'medium',
      description: 'No question-style headings (who/what/why/how)', recommendation: 'Add conversational question headings to capture voice search' });
  }

  if (!/"@type"\s*:\s*"FAQPage"/i.test(html)) {
    issues.push({ page_url: url, category: 'voice', issue_type: 'no_faq_schema', severity: 'medium',
      description: 'No FAQPage schema for voice assistants', recommendation: 'Add FAQPage JSON-LD with common questions and concise answers' });
  }

  if (!/"speakable"/i.test(html)) {
    issues.push({ page_url: url, category: 'voice', issue_type: 'no_speakable', severity: 'low',
      description: 'No SpeakableSpecification schema', recommendation: 'Add speakable schema to highlight content for voice assistants' });
  }

  // Concise answer hint: avg sentence length
  const text = markdown || html.replace(/<[^>]+>/g, ' ');
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  if (sentences.length > 0) {
    const avgWords = sentences.reduce((a, s) => a + s.split(/\s+/).length, 0) / sentences.length;
    if (avgWords > 25) {
      issues.push({ page_url: url, category: 'voice', issue_type: 'long_sentences', severity: 'low',
        description: `Long avg sentence length (${Math.round(avgWords)} words)`, recommendation: 'Use shorter sentences (under 20 words) for voice readability' });
    }
  }

  return issues;
}

function computeScores(issues: Issue[], pageCount: number) {
  const weight = (s: string) => s === 'high' ? 15 : s === 'medium' ? 8 : 3;
  const subScore = (cat: string) => {
    const cIssues = issues.filter(i => i.category === cat);
    const penalty = cIssues.reduce((a, i) => a + weight(i.severity), 0) / Math.max(1, pageCount);
    return Math.max(0, Math.min(100, Math.round(100 - penalty)));
  };
  const technical_score = subScore('technical');
  const content_score = subScore('content');
  const schema_score = subScore('schema');
  const voice_seo_score = subScore('voice');
  const overall_score = Math.round((technical_score + content_score + schema_score + voice_seo_score) / 4);
  return { technical_score, content_score, schema_score, voice_seo_score, overall_score };
}
