

## Goal
Add a new "Accessibility" product module to the platform that lets organizations install a lightweight accessibility widget on their websites, scan pages for issues, monitor scores, and generate reports — positioned as an enhancement/risk-reduction layer (not a legal compliance guarantee).

## What Will Be Built

### 1. Database (new migration)
Four new tables, all org-scoped with RLS following existing patterns:

- **`accessibility_sites`** — `id`, `organization_id`, `domain`, `business_name`, `site_id` (public token for script), `is_active`, `created_at`, `updated_at`
- **`accessibility_scans`** — `id`, `site_id`, `score` (0–100), `pages_scanned`, `summary` (jsonb), `status`, `created_at`
- **`accessibility_issues`** — `id`, `scan_id`, `category` (image/form/heading/contrast/structure), `severity` (low/medium/high), `description`, `recommendation`, `element_snippet`, `page_url`
- **`accessibility_settings`** — `id`, `site_id` (unique), `high_contrast`, `font_scaling`, `reduced_motion`, `spacing`, `highlight_links`, `widget_active`, `updated_at`

RLS: org members can SELECT, org admins/owners can manage. Public anon SELECT on `accessibility_settings` by `site_id` so the widget script can fetch toggles.

### 2. Product registration
- Add `'accessibility'` to `ProductId` type and `ALL_PRODUCTS` in `src/hooks/useProductAccess.ts`
- Add nav item "Accessibility" (icon: `Accessibility` from lucide) to `AppSidebar.tsx` under Platform group
- Add `/dashboard/accessibility` and `/dashboard/accessibility/:siteId` routes in `App.tsx`, gated with `ProtectedProductRoute`

### 3. UI Components (new directory `src/components/accessibility/`)

- **`AccessibilityDashboard.tsx`** — Overview metrics (total sites, avg score, total open issues, last scan), list of site cards, "Add Website" CTA
- **`SiteCard.tsx`** — Domain, score badge (color-coded), issue count, last scan, "View Site" button
- **`AddSiteDialog.tsx`** — Form (domain + optional business name); on submit shows generated `<script>` snippet with copy-to-clipboard and install instructions
- **`SiteDetailPage.tsx`** — Tabs: Overview, Issues, Settings, Statement, Install
  - Overview: score gauge, scan summary, "Scan Now" button
  - Issues: grouped by category, each with severity badge, description, why-it-matters, fix recommendation
  - Settings: toggles for the 5 widget features (`Switch` components), saved per site
  - Statement: editable textarea with auto-generated non-guarantee accessibility statement, copy button
  - Install: script tag, copy button, install instructions, "widget active" status indicator
- **`InstallSnippet.tsx`** — reusable snippet display with copy button
- **`ScoreBadge.tsx`** — color-coded score (green ≥85, amber 60–84, red <60)
- **`ReportButton.tsx`** — generates a printable PDF report for the site (using `window.print()` on a styled report view, or jsPDF if already in deps)

### 4. Hooks (`src/hooks/`)
- **`useAccessibilitySites.ts`** — list/create/update/delete sites, per-org
- **`useAccessibilityScans.ts`** — fetch scans + issues for a site, trigger new scan
- **`useAccessibilitySettings.ts`** — get/update widget toggle settings

### 5. Edge Functions (`supabase/functions/`)
- **`accessibility-scan/`** — POST `{ site_id }`. Verifies caller is org member, fetches site domain HTML (homepage), parses with regex/DOM-lite to detect:
  - `<img>` missing/empty `alt`
  - `<input>`/`<select>`/`<textarea>` missing associated `<label>` or `aria-label`
  - multiple `<h1>` tags / skipped heading levels (h1→h3)
  - empty `<a>`/`<button>` text
  - missing `lang` on `<html>`, missing `<title>`
  Computes weighted score (high=−15, medium=−7, low=−3, capped 0–100), inserts a scan + issues rows.
- **`accessibility-widget-config/`** — Public (no JWT). GET `?site=SITE_ID`. Returns settings JSON for the installed script.

### 6. Public widget script
- **`public/accessibility.js`** — Vanilla JS that:
  - reads `?site=` query param from its own `<script src>`
  - calls `accessibility-widget-config` to load enabled features
  - injects a small floating accessibility menu with toggles for high contrast, font scaling, reduced motion, spacing, highlight links
  - applies CSS overrides to host page when toggled
  - persists user choices in `localStorage`
- Served from project's own domain (`/accessibility.js`); install snippet uses the project's preview/published origin.

### 7. Marketing/positioning copy
- All UI text uses "Accessibility Enhancement", "Usability + Risk Reduction", "Ongoing Monitoring"
- Avoid "ADA compliant", "guaranteed", "fully compliant"
- Auto-generated accessibility statement uses non-guarantee language ("committed to improving…", "ongoing efforts…")
- A small disclaimer banner appears on the dashboard footer

### 8. Pricing/access
- New product registered for purchase access management; platform admins can grant via existing `OrgProductAccessManager`
- `ProtectedProductRoute` shows the standard upgrade prompt with feature list when org lacks access

## Out of Scope (Future Hooks Only)
- Automated scheduled re-scans (table structure ready; no cron yet)
- Email alerts for new issues
- AI-generated fix suggestions
- Multi-page deep crawling (MVP scans homepage only)
- CDN-hosted versioned script delivery (script served from app origin for MVP)

## Technical Notes
- Reuses: `Card`, `Tabs`, `Switch`, `Dialog`, `Badge`, `Button`, `Alert`, `useOrganization`, `usePlatformAdmin`, `ProtectedProductRoute`, existing toast system
- Score color tokens use existing `text-green-600 / text-amber-600 / text-destructive` classes already in use across SEO audit dashboard
- Scan edge function follows the same shape as `seo-audit/index.ts` (fetch → parse → score → insert)
- Widget script is plain JS (no React) to keep payload small (~5 KB)
- All inserts/updates respect RLS via the user's session token; the scan edge function uses the service role only for inserting scan/issue rows after authorizing the caller

