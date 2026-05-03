## Goal

Generate a single, copy-paste-ready prompt for **Manus.ai** that describes the Causeio accessibility widget in enough detail that Manus can produce a functionally equivalent **WordPress plugin**.

No code changes will be made to this project. The deliverable is a Markdown file the user can copy from.

## What the prompt will include

Drawn from the actual implementation in this repo (`public/accessibility.js`, `supabase/functions/accessibility-widget-config`, `accessibility-feedback-submit`, `src/components/accessibility/SiteSettingsPanel.tsx`, `src/hooks/useAccessibilitySettings.ts`):

1. **Product overview** — what the widget does and who it's for (WCAG 2.1 AA assistive overlay).
2. **Full feature inventory**, grouped exactly like our settings panel:
   - Profiles & Utilities (profiles, language translator, report-an-issue, oversize widget)
   - Content adjustments (font scaling, highlight links, dyslexia font, letter spacing, line height, bolder text, reading spacing bundle)
   - Color adjustments (contrast modes, saturation, monochrome)
   - Orientation & navigation (reading mask, reading guide, big cursor, stop animations, reduced motion)
3. **UX requirements** — floating launcher button, position (left/center/right), slide-out panel, persistent state per-site in `localStorage`, accessibility statement link, keyboard focus styles.
4. **WordPress-specific requirements**:
   - Plugin header, activation/deactivation hooks, uninstall cleanup
   - Admin settings page under Settings → Accessibility (mirror of our `SiteSettingsPanel` toggles)
   - Settings stored via WordPress Options API (no external backend required for MVP)
   - Optional: REST endpoint for the "Report an issue" form, storing feedback in a custom DB table, plus admin inbox
   - Frontend enqueue via `wp_enqueue_script` / `wp_enqueue_style`, loaded site-wide
   - Shortcode `[causeio_a11y_statement]` and auto-generated statement page on activation
   - i18n with `__()` / `_e()` and `.pot` file
   - Gutenberg block (optional) for the statement
   - No jQuery dependency — vanilla JS
5. **Architecture & file layout** suggestion for the plugin (`/causeio-accessibility/causeio-accessibility.php`, `/admin/`, `/public/`, `/includes/`, `/languages/`, `/assets/`).
6. **Acceptance criteria** — toggles persist, widget renders on every page, no JS errors, passes WP Plugin Check, works without conflicting with common themes.
7. **Tone/branding note** — keep visual style close to our current widget (deep blue `#1e3a8a` accent, amber focus ring `#fbbf24`, rounded 12px panel) but allow admin to customize accent color.

## Deliverable

A single file: `/mnt/documents/manus-wordpress-plugin-prompt.md` containing the prompt, ready to paste into Manus.ai. After generating it, I'll surface it as a downloadable artifact.

## Out of scope

- Actually building the WordPress plugin
- Modifying any existing Causeio code
- Migrating data from the SaaS widget to the plugin

Approve and I'll generate the file.