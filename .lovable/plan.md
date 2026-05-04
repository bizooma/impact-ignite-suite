
# Brand Kits — Implementation Plan

A single Brand Kit per organization becomes the source of truth for colors, typography, logos, and voice. Every app on the platform reads from it. Users can build it manually or upload a PDF brand guide for AI-assisted extraction. A dashboard banner + setup checklist makes "Set up your brand kit" the clear first step.

---

## 1. Data Model (new tables)

### `brand_kits`
- `id`, `organization_id` (unique — 1 per org), timestamps
- **Colors** (hex strings): `primary_color`, `secondary_color`, `accent_color`, `text_color`, `background_color`, `extended_palette` (jsonb array)
- **Typography**: `heading_font_family`, `body_font_family`, `heading_font_url`, `body_font_url` (Google Fonts URL or uploaded font file URL), `heading_font_weight`, `body_font_weight`
- **Logos** (storage URLs): `logo_primary_url`, `logo_mark_url`, `logo_light_url`, `logo_dark_url`, `favicon_url`
- **Voice & content**: `tagline`, `mission_statement`, `voice_descriptors` (jsonb array, e.g. `["warm", "professional", "hopeful"]`), `do_use` (text), `dont_use` (text)
- **Status**: `setup_completed_at` (null until user finishes), `source` (`manual` | `pdf_import` | `hybrid`)

### `brand_kit_imports`
Tracks each PDF import attempt for debugging + re-running.
- `id`, `brand_kit_id`, `organization_id`, `pdf_file_path` (storage), `status` (`pending`/`processing`/`completed`/`error`), `extracted_data` (jsonb — raw extraction results), `error_message`, timestamps

### Storage bucket
- New public bucket `brand-kits/` for logos, favicons, custom font files, uploaded PDFs

### RLS
- Org members can read; admins/owners can write — same pattern as other org-scoped tables

---

## 2. Brand Kit Builder UI

New route: `/dashboard/brand-kit`

A single-page builder with sections (no wizard — open editing, save as you go):

1. **Colors** — color picker swatches with labels (Primary, Secondary, Accent, Text, Background) + extended palette. Live preview shows a sample card/button using the colors.
2. **Typography** — Google Fonts picker (search + preview), or upload `.woff2` file. Separate selectors for heading vs body. Live preview paragraph.
3. **Logos** — drag-and-drop upload zones for primary, mark/icon, light variant, dark variant, favicon. Auto-detects transparent backgrounds.
4. **Voice** — short text fields (tagline, mission, voice descriptors as chips, do/don't lists)
5. **Preview tab** — renders mock chatbot widget, mock QR code, mock social post, mock email header — all using the kit. Lets users see consistency before saving.

Sticky save bar at bottom; "Apply across all apps" button on first save (warns: this overrides existing per-app brand settings).

---

## 3. PDF Import Flow

New edge function: `import-brand-kit-from-pdf`

**Pipeline**:
1. User uploads PDF via builder ("Import from PDF brand guide" button)
2. PDF stored in `brand-kits/{org_id}/imports/`
3. Edge function:
   - Uses **Lovable AI Gateway** (Gemini multimodal — accepts PDFs natively) with a structured prompt:
     > "Analyze this brand guide PDF. Extract: dominant colors with hex values and likely role (primary/secondary/accent/neutral); font family names mentioned for headings and body; tagline/mission statement; voice & tone descriptors. Return strict JSON."
   - For logos: extracts embedded images using `pdfjs-dist` or `pdf-lib` in the edge function, uploads each candidate to storage
   - Stores everything in `brand_kit_imports.extracted_data`
4. User lands on a **Review screen**:
   - Detected colors shown as draggable chips → drop into Primary / Secondary / Accent / Text / Background slots
   - Detected fonts shown with auto-matched Google Font + "pick alternative" dropdown (curated list of free alternatives for common paid fonts: Proxima Nova → Montserrat, Gotham → Montserrat, Helvetica Neue → Inter, etc.)
   - Detected logos shown as a grid → user picks which image is the primary, mark, etc.
   - Tagline/mission/voice prefilled into editable text fields
5. "Confirm & Save" finalizes the kit

Honest UX framing: "We extracted what we could — review and adjust. Font matching is approximate."

---

## 4. App Integration (Hard Switch)

Per the chosen migration strategy, the brand kit **overrides** existing per-app settings once it exists. Per-asset override toggle remains for exceptions.

A new shared hook `useBrandKit(organizationId)` returns the current kit (or null). A helper `resolveBrandColors(kit, override)` returns the effective palette, preferring the override when explicitly set.

**Apps to wire up**:
- `ChatbotWidget`, `ChatbotPreview`, `ChatbotFooter`, `StandaloneWidget` — replace `chatbot.brand_settings` lookups with brand kit (per-chatbot override flag)
- `QrCodeGenerator`, `QrSettingsDialog`, `QrCodeDashboard` — replace `qr.brand_config.color` and logo with brand kit
- `CampaignAnalytics`, `CampaignDashboard`, `GoalThermometer`, `CountdownClock` — apply brand colors to charts and progress UI
- `AcknowledgmentDraftDialog` + future email templates — use brand kit for header colors and logo
- `AccessibilityDashboard` widget snippet — pre-fill button color from brand kit
- `MobileContentDashboard` — mobile app theme uses brand kit colors
- `FlipbookViewer` — accent colors for navigation chrome
- `PostComposer` social previews — watermark logo

**Migration on first kit save**: A one-time job (run client-side on save) updates existing chatbots' `brand_settings` and QR codes' `brand_config` with the kit values, so historical assets immediately reflect the kit. Per-asset override flag (`use_brand_kit: false`) preserved on anything the user explicitly customizes after.

---

## 5. Onboarding — Banner + Setup Checklist

### Dashboard banner (`MainDashboard.tsx`)
Shown when `brand_kits.setup_completed_at IS NULL`:
- Full-width card at top, dismissible per-user (stored in localStorage so it doesn't keep nagging)
- Headline: "Step 1: Set up your Brand Kit"
- Subtext: "Every app on Causeio uses your brand kit so your chatbot, QR codes, social posts, and campaigns all look consistent."
- Two CTAs: **Build it manually** (→ `/dashboard/brand-kit`) and **Upload PDF brand guide** (→ `/dashboard/brand-kit?import=pdf`)

### Setup checklist widget
New component `OnboardingChecklist.tsx` on the dashboard:
- Step 1: ✅/⬜ Set up Brand Kit
- Step 2: ✅/⬜ Connect first integration (social, GBP, or Mailchimp)
- Step 3: ✅/⬜ Create your first chatbot or QR code
- Step 4: ✅/⬜ Invite a team member
Auto-collapses once all 4 are done. Persists state in a new `org_onboarding_state` table (or jsonb column on `organizations`).

### Soft nudges
When users open `ChatbotBuilder`, `QrCodeGenerator`, or `CampaignBriefWizard` for the first time without a kit, show a one-time toast: "Tip: Set up your Brand Kit so this matches your brand automatically →"

---

## 6. Files to Add / Modify

**New files**:
- `src/pages/BrandKit.tsx` — main builder page
- `src/components/brand-kit/ColorsSection.tsx`
- `src/components/brand-kit/TypographySection.tsx`
- `src/components/brand-kit/LogosSection.tsx`
- `src/components/brand-kit/VoiceSection.tsx`
- `src/components/brand-kit/BrandKitPreview.tsx`
- `src/components/brand-kit/PdfImportDialog.tsx`
- `src/components/brand-kit/PdfImportReview.tsx`
- `src/components/brand-kit/GoogleFontPicker.tsx`
- `src/components/dashboard/BrandKitBanner.tsx`
- `src/components/dashboard/OnboardingChecklist.tsx`
- `src/hooks/useBrandKit.ts`
- `src/lib/brandKit.ts` — `resolveBrandColors`, `applyBrandKitToChatbots`, font alternative mapping
- `supabase/functions/import-brand-kit-from-pdf/index.ts`

**Modified**:
- `src/App.tsx` — add `/dashboard/brand-kit` route
- `src/components/layout/AppSidebar.tsx` — add "Brand Kit" nav item near top
- `src/components/dashboard/MainDashboard.tsx` — render banner + checklist
- `src/components/chatbot/*` — read from brand kit
- `src/components/qr/*` — read from brand kit
- `src/components/campaigns/CampaignAnalytics.tsx` — chart colors from brand kit
- Migration to create tables, storage bucket, and RLS policies

---

## 7. Technical Notes

- **PDF parsing in edge function**: Lovable AI Gateway's Gemini models accept PDFs as input directly — no need to rasterize first for color/font/text extraction. For logo image extraction we use `pdf-lib` (Deno-compatible) to pull embedded images.
- **Color detection accuracy**: ~85-90% for well-designed brand guides. Always present as suggestions in a review screen — never auto-apply.
- **Font alternatives map**: Hardcoded curated mapping in `src/lib/brandKit.ts` covering ~30 common paid fonts → free Google Font equivalents (Proxima Nova → Montserrat, Gotham → Montserrat, Helvetica Neue → Inter, Avenir → Nunito, DIN → Barlow, Futura → Jost, etc.).
- **Font loading at runtime**: Inject a `<link>` tag for the Google Font URL into `<head>` when the brand kit loads (via `useBrandKit` hook side-effect), so any app reading `body_font_family` actually has the font available.
- **No tier gating**: 1 brand kit per org on every plan, including free.
- **Chart colors**: Recharts components in analytics will read brand kit colors via a CSS variable injection layer (set `--brand-primary`, `--brand-accent` on the dashboard root when kit loads).

---

## 8. Out of Scope (future iterations)

- Multiple brand kits per org (sub-brands, fiscal sponsorships) — could be a Pro/Enterprise upsell later
- Brand kit versioning / history
- Auto-generated brand guide PDF export ("Download your brand kit as a PDF")
- Figma plugin sync
- Brand asset library (stock photos, icon sets)

---

## 9. Rollout Order

1. Migration: tables, storage bucket, RLS
2. `useBrandKit` hook + `resolveBrandColors` helper
3. Manual builder page (Colors, Typography, Logos, Voice, Preview)
4. Dashboard banner + onboarding checklist
5. Wire into Chatbot first (highest visual impact, easy to verify)
6. PDF import edge function + review screen
7. Wire into QR, Campaigns, Acknowledgments, Accessibility widget, Mobile, Flipbook, Social
8. Migration job to backfill existing chatbots/QR codes from the new kit
