
Upgrade the SEO audit engine to perform a real, multi-page, multi-category audit using Firecrawl for JS-rendered crawling, and populate the previously-empty Technical / Content / Schema / Voice SEO sub-scores.

## Approach

Rebuild `supabase/functions/seo-audit/index.ts` to:

1. **Discover pages** — fetch `/sitemap.xml` (fall back to homepage-only if missing), cap at 10 URLs.
2. **Fetch each page via Firecrawl** (`/v2/scrape`, formats: `html`, `markdown`, `links`, `metadata`) so SPA/JS-rendered sites work. Fall back to plain `fetch` if Firecrawl key missing.
3. **Run categorized checks** on each page:
   - **Technical**: status code, response time, robots.txt presence, canonical tag, viewport meta, HTTPS, broken internal links (sample), image alt attributes
   - **Content**: title length (30–60), meta description length (120–160), exactly one H1, heading hierarchy, word count, readability hint
   - **Schema**: presence of JSON-LD, Organization/LocalBusiness/FAQ/BreadcrumbList schemas, Open Graph tags, Twitter Card tags
   - **Voice SEO**: FAQ schema, conversational/question-style headings, speakable schema, content readability, concise answer paragraphs near questions
4. **Compute sub-scores** (0–100) per category as `100 - weighted_penalties`, then `overall_score = avg(4 sub-scores)`.
5. **Persist** `technical_score`, `content_score`, `schema_score`, `voice_seo_score`, `pages_crawled` (real count), `overall_score`, and detailed `audit_issues` rows tagged with `category` (technical/content/schema/voice) and `page_url`.

## Frontend

`src/hooks/useSeoAudits.ts` — pass through the new score fields the edge function returns instead of computing `overall_score` on the client.

`src/components/seo/SeoAuditDashboard.tsx` — already renders Technical/Content/Schema/Voice columns; will now show real values instead of nulls. No structural change needed.

## Secrets

Requires `FIRECRAWL_API_KEY`. Will connect the Firecrawl connector if not already linked, then deploy the updated function. If user declines Firecrawl, falls back to plain-fetch mode (works but limited on SPAs — same caveat as today, just with the expanded check set).

## Outcome

The SEO Audit dashboard shows real, populated scores across all four categories, crawls multiple pages from the sitemap, and lists categorized, actionable issues — no mock or hardcoded values.
