
# Accessibility Widget — Major Upgrade Plan

The reference (Webability/UserWay-style) widget is far richer than ours. Today our `public/accessibility.js` ships only 5 toggles (high contrast, larger text, reduced motion, spacing, highlight links). We'll rebuild it into a full-featured panel that competes with commercial overlays, while keeping it lightweight, vanilla JS, and driven by the existing `accessibility-widget-config` edge function.

## What the new widget will include

**Header bar**
- Title "Accessibility Menu"
- Quick toggles: light/dark site mode, hide images, screen reader hint, close (X)

**Top utilities**
- "Report an issue" button → opens a small form (name, email, message) that POSTs to a new edge function and stores into a new `accessibility_feedback` table.
- "Select language" dropdown → triggers Google Translate widget (lightweight, no API key needed) for the host site.
- "Oversize widget" toggle → scales the entire panel UI ~125% for low-vision users.

**Accessibility Profiles** (one-click bundles)
- Seizure Safe (reduced motion + desaturated colors)
- Vision Impaired (larger text + high contrast + spacing)
- ADHD Friendly (reading mask + reduced motion)
- Cognitive Disability (highlight links + larger text + simplified layout)
- Keyboard Navigation (focus outlines + skip-to-content)
- Screen Reader (ARIA hints, semantic emphasis)

**Content Adjustments**
- Font size slider (5 steps, 100%–200%) with ◀ ▶ controls
- Highlight Title / Highlight Links buttons
- Dyslexia-friendly font (loads OpenDyslexic from CDN)
- Letter spacing, Line height, Font weight (toggle buttons)

**Color Adjustments**
- Contrast (cycle: normal → dark → light → high-contrast)
- Saturation (cycle: normal → low → high → monochrome)
- Monochrome toggle
- Text color / Title color / Background color pickers (small swatch row)

**Orientation & Navigation**
- Reading mask (dark band that follows the cursor)
- Reading guide (highlighted line under cursor)
- Big black/white cursor toggles
- Stop animations (pauses GIFs, videos, CSS animations)
- Page structure helper (lists headings/landmarks for jumping)

**Footer**
- Link to the org's saved Accessibility Statement
- "Reset all settings" button
- Small branding line ("Powered by Causeio")

All toggles persist in `localStorage` per site (we already use `lov_a11y_state_<siteId>`) and apply on next page load.

## Technical implementation

### 1. Rewrite `public/accessibility.js`
Replace the current 150-line script with a modular ~600-line vanilla JS file:
- Split into sections (`buildHeader`, `buildProfiles`, `buildContentSection`, `buildColorSection`, `buildOrientationSection`, `buildFooter`).
- Add a much larger `<style>` block with all utility classes (`.lov-a11y-hc`, `.lov-a11y-fs-1` through `.lov-a11y-fs-5`, `.lov-a11y-dyslexic`, `.lov-a11y-mono`, `.lov-a11y-sat-low`, `.lov-a11y-cursor-big-black`, `.lov-a11y-stop-anim`, `.lov-a11y-reading-mask`, etc.).
- Implement profiles as bundles that toggle multiple atomic settings at once.
- Keep file under ~25KB minified — no external deps except optional OpenDyslexic font and Google Translate `element.js` loaded only when those features are activated.
- Reading mask / reading guide use a single fixed-position overlay div updated via `pointermove`.

### 2. Extend `accessibility_settings` table
Add nullable boolean columns so site admins can toggle each new feature on/off in the dashboard:
- `dyslexia_font`, `letter_spacing`, `line_height`, `font_weight_adj`
- `saturation_adj`, `monochrome`, `color_pickers`
- `reading_mask`, `reading_guide`, `big_cursor`, `stop_animations`, `page_structure`
- `profiles_enabled` (bool), `language_selector` (bool), `report_issue` (bool), `oversize_widget` (bool)
- `statement_url` (text, optional override; otherwise link to the auto-generated statement page)

Migration: `ALTER TABLE` with sensible defaults (most `true`).

### 3. Update `accessibility-widget-config` edge function
Return all new flags in the `features` object, plus `statementUrl` and `language_selector` flag. Keep response cached 60s.

### 4. New `accessibility_feedback` table + edge function
- Table: `id, site_id, name, email, message, page_url, user_agent, created_at, status`. RLS: org members of the site can read; anonymous insert allowed via edge function.
- New edge function `accessibility-feedback-submit` (public, no JWT) validates and inserts.

### 5. Dashboard updates
- `SiteSettingsPanel.tsx`: expand the toggle list to cover all new features, grouped under "Profiles", "Content", "Color", "Navigation", "Utilities".
- New `SiteFeedbackPanel.tsx` (new tab "Feedback") to view submitted issue reports.
- Add the new tab to `SiteDetailPage.tsx`.

### 6. Statement link wiring
The widget footer "Accessibility Statement" link will point to a new public route `/a11y/:siteId/statement` (or use `statement_url` override). Add a thin public page that renders `accessibility_settings.statement_text` for that site.

## File map

```text
public/accessibility.js                           (rewrite, ~600 lines)
supabase/migrations/<ts>_a11y_widget_v2.sql       (new: columns + feedback table + RLS)
supabase/functions/accessibility-widget-config/index.ts   (extend response)
supabase/functions/accessibility-feedback-submit/index.ts (new)
src/hooks/useAccessibilitySettings.ts             (extend type)
src/components/accessibility/SiteSettingsPanel.tsx (expand toggles, grouped)
src/components/accessibility/SiteFeedbackPanel.tsx (new)
src/components/accessibility/SiteDetailPage.tsx   (add Feedback tab)
src/pages/AccessibilityStatement.tsx              (new public page)
src/App.tsx                                       (add public route)
```

## Out of scope (can follow in a later pass)
- Full multi-language UI of the widget itself (we'll ship English; Google Translate handles host-page translation).
- AI-powered alt-text generation on the fly.
- Voice navigation.

## Risks / notes
- Script size grows from ~5KB to ~20KB — still acceptable for `defer` loading.
- Reading mask + big cursor use high z-index overlays; we'll guard against conflict with site modals by sitting just below `2147483647`.
- Google Translate injection runs only when the user opens the language picker, to avoid affecting host-site SEO.
