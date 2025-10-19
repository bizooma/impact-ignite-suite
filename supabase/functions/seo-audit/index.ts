import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEO-AUDIT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("SEO audit function started");

    const { domain } = await req.json();
    logStep("Processing audit", { domain });

    // Basic SEO audit checks
    const auditResults = await performSeoAudit(domain);
    logStep("Audit completed", { issuesFound: auditResults.length });

    // Return results immediately
    return new Response(JSON.stringify({ 
      success: true,
      issues: auditResults,
      issuesFound: auditResults.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in seo-audit", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function performSeoAudit(domain: string) {
  const issues = [];
  
  try {
    // Remove protocol if present to avoid double https://
    const cleanDomain = domain.replace(/^https?:\/\//, '');
    
    // Fetch the website
    const response = await fetch(`https://${cleanDomain}`);
    const html = await response.text();
    
    // Basic SEO checks
    if (!html.includes('<title>')) {
      issues.push({
        issue_type: 'missing_title',
        severity: 'high',
        description: 'Missing title tag',
        recommendation: 'Add a descriptive title tag to improve SEO'
      });
    }
    
    if (!html.includes('meta name="description"')) {
      issues.push({
        issue_type: 'missing_meta_description',
        severity: 'medium',
        description: 'Missing meta description',
        recommendation: 'Add a meta description to improve search result snippets'
      });
    }
    
    // Check for multiple H1 tags
    const h1Matches = html.match(/<h1[^>]*>/gi);
    if (!h1Matches || h1Matches.length === 0) {
      issues.push({
        issue_type: 'missing_h1',
        severity: 'high',
        description: 'Missing H1 tag',
        recommendation: 'Add exactly one H1 tag per page for better SEO structure'
      });
    } else if (h1Matches.length > 1) {
      issues.push({
        issue_type: 'multiple_h1',
        severity: 'medium',
        description: `Multiple H1 tags found (${h1Matches.length})`,
        recommendation: 'Use only one H1 tag per page and use H2-H6 for subheadings'
      });
    }
    
    // Check for images without alt tags
    const imgMatches = html.match(/<img[^>]*>/gi);
    if (imgMatches) {
      const imagesWithoutAlt = imgMatches.filter(img => !img.includes('alt='));
      if (imagesWithoutAlt.length > 0) {
        issues.push({
          issue_type: 'missing_alt_tags',
          severity: 'medium',
          description: `${imagesWithoutAlt.length} images missing alt attributes`,
          recommendation: 'Add descriptive alt attributes to all images for accessibility and SEO'
        });
      }
    }
    
    // Check response time
    const startTime = Date.now();
    await fetch(`https://${cleanDomain}`);
    const responseTime = Date.now() - startTime;
    
    if (responseTime > 3000) {
      issues.push({
        issue_type: 'slow_response_time',
        severity: 'high',
        description: `Slow page load time: ${responseTime}ms`,
        recommendation: 'Optimize page loading speed by compressing images, minifying CSS/JS, and using a CDN'
      });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    issues.push({
      issue_type: 'audit_error',
      severity: 'high',
      description: `Failed to audit domain: ${errorMessage}`,
      recommendation: 'Ensure the domain is accessible and try again'
    });
  }
  
  return issues;
}