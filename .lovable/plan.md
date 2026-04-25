# Causeio Launch-Readiness Plan

Goal: in 2 weeks, ship a site where every visible feature actually works. Anything not working gets either built, hidden, or clearly labeled.

---

## Phase 1 — Critical fixes (do first, ~1 day)

### 1.1 Fix mobile-app password hashing (SECURITY)
- **Problem:** `src/components/mobile/UserCSVImport.tsx:149` stores plaintext passwords as `password_hash`.
- **Fix:**
  - Create new edge function `mobile-hash-password` that takes a plaintext password, hashes it with bcrypt (already used in `mobile-app-proxy/create_user_with_hash`), and returns the hash. Auth-gated to org admins.
  - Update `UserCSVImport.tsx` to call this function for each row before inserting via `mobile-app-proxy`. Reject rows whose password is empty/too short.
  - Add a length/strength check (min 8 chars).

### 1.2 Fix `yourdomain.com` in SEO schemas
- Replace all 6 occurrences in `src/pages/Landing.tsx` (lines 25-26) and `src/pages/Pricing.tsx` (lines 94, 112, 140, 168) with `https://causeio.com` (or the published domain you're using).
- Replace `https://yourdomain.com/assets/causeio-logo.png` with the actual hosted logo URL.

### 1.3 Hide placeholder Mobile App Analytics tab
- In `MobileAppDashboard.tsx`, remove the "Analytics" `TabsTrigger` and `TabsContent` for `MobileAppAnalytics` until real analytics ship. Delete `MobileAppAnalytics.tsx`.

### 1.4 Remove "Year-End Giving" template tile
- In `src/components/campaigns/CampaignTemplatePicker.tsx`, delete the disabled `<Card>` block for "Year-End Giving" (lines 57-63). Adjust grid to `md:grid-cols-2`.

---

## Phase 2 — Google Business: strip to reviews-only (~0.5 day)

We keep what already works (OAuth + review monitoring) and remove the simulated stats/tasks.

### 2.1 Edge function changes
- **Delete or stop using** `gbp-sync` entirely (the `simulateGbpSync` function with `Math.random()` fake metrics).
- **Keep** `gbp-oauth-callback`, `gbp-sync-reviews`, `gbp-generate-response`, `gbp-post-response`, `gbp-quick-approve`, `gbp-notify-review`.
- Verify `gbp-sync-reviews` actually hits the Google My Business API (read its body and confirm — if it's also stubbed, we'll either implement it for real or hide GBP entirely; will report findings during build).

### 2.2 UI changes (`src/components/gbp/GbpDashboard.tsx`)
- Remove all stat cards that reference fake metrics (views, clicks, calls, directions). Keep:
  - **Reviews** count and average rating (real, from `gbp_reviews` table)
  - **Pending review responses** counter
  - **Profile completeness** card (real, calculated from user-entered profile data, not the random fake)
- Remove the "Sync Profile" button (or rename to "Sync Reviews" and call `gbp-sync-reviews`).
- Remove the `TaskManager` tab and the auto-generated optimization tasks fed by `simulateGbpSync` results.
- Update copy/description to "Monitor and respond to Google reviews."

### 2.3 Module card and product gating
- In `src/components/dashboard/MainDashboard.tsx`, update the Google Business card description to "Monitor and respond to your Google reviews."
- In `src/App.tsx` `ProtectedProductRoute`, update `description` and `features` arrays for `google_business` to match the trimmed scope.
- Update landing page copy in `src/pages/Landing.tsx` for "Google Business" feature.

---

## Phase 3 — Social Media: ship Facebook only, hide the rest (~4-5 days)

### 3.1 Hide Instagram, LinkedIn (keep Twitter as visual "Coming Soon")
- In `src/components/social/SocialIntegrationsPanel.tsx`: keep only the Facebook entry in `socialPlatforms`. Remove Instagram, LinkedIn entries.
- In `src/components/social/SocialMediaDashboard.tsx`: remove Instagram/LinkedIn from `platforms` filter array. Keep Twitter with a "Coming Soon" badge in the platform list and the composer's platform select.
- In `src/components/social/PostComposer.tsx`: in the platform `<Select>`, keep Facebook as the only enabled option; show Twitter as disabled with "Coming Soon" badge; remove Instagram and LinkedIn options.
- Delete preview components for `InstagramPreview.tsx` and `LinkedInPreview.tsx` (they're not needed). Keep `FacebookPreview.tsx`. Twitter preview already shows "Coming soon" — keep as is.
- Update DB enum / `social_publisher` switch to only handle `facebook` going forward.

### 3.2 Build real Facebook OAuth
- Create new edge function `facebook-oauth-start` — generates Facebook Login URL with required scopes (`pages_show_list`, `pages_manage_posts`, `pages_read_engagement`) and `state` param for CSRF.
- Create new edge function `facebook-oauth-callback` — exchanges `code` for short-lived user token, exchanges that for a long-lived token, fetches the user's Pages list, lets user pick a Page (we'll persist the first one for v1, or show a selector), stores Page ID + Page Access Token in `integrations.encrypted_tokens`. Sets `provider='facebook'`, `status='active'`.
- Wire `SocialIntegrationsPanel.handleConnect('facebook')` to call `facebook-oauth-start` and redirect.
- Wire `SocialIntegrationsPanel.handleDisconnect('facebook')` to call existing `deleteIntegration` and revoke (best effort).

**Required from you before we can ship this:** create a Facebook App in https://developers.facebook.com, add Facebook Login product, configure OAuth redirect URI to our `facebook-oauth-callback` URL, and provide:
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`

(Lovable Cloud / Supabase secrets — I'll request these via the secret tool when we get to this step.)

### 3.3 Replace simulated `social-publisher` with real Facebook publishing
- Rewrite `supabase/functions/social-publisher/index.ts`:
  - Look up the post and the org's active Facebook integration.
  - For `platform === 'facebook'`: POST to `https://graph.facebook.com/v19.0/{page-id}/feed` (or `/photos` for image posts) using the Page Access Token from `encrypted_tokens`.
  - On success: store the returned `id` as `external_post_id`, set `published_at` to actual API timestamp, status `published`.
  - On failure: set status `failed`, record error in metadata, surface error toast in UI.
  - For any other platform: return `{ error: "Platform not yet supported" }` and don't fake success.
- Update `useSocialPosts` toast handling so failures actually show an error to the user.

### 3.4 Update Stats card and copy
- Landing page "Social Media" feature card → "Schedule Facebook posts (Instagram & LinkedIn coming soon)".

---

## Phase 4 — Smaller polish (~0.5 day)

### 4.1 Mailchimp sync count accuracy (optional but recommended)
- After submitting a Mailchimp batch, poll `/batches/{id}` (with timeout/backoff) to get accurate `total_operations`, `finished_operations`, `errored_operations`. Update `crm_mailchimp_sync_logs` with real counts. If we run out of time, leave the existing `// Note:` comment but update the UI to say "approximate".

### 4.2 Verify Calendly link
- Confirm `https://calendly.com/joe-bizooma/30min` in `src/pages/Landing.tsx` (lines 460, 509) is the right link for Causeio (vs. a Causeio-branded Calendly). If wrong, replace.

---

## Phase 5 — Pre-launch QA pass

After all phases, walk every dashboard route logged in as a fresh org and verify:
- No "Coming Soon" or "will be implemented" text reaches the user except where intentional (Twitter, future modules badged on landing page).
- `Math.random()` fake data is gone everywhere user-facing.
- All product cards on `/dashboard` resolve to working features (or are removed).
- Stripe checkout works for Starter / Professional / Enterprise on both standard and beta pricing.
- Beta signup form on landing page successfully creates a record and triggers CRM sync.
- Mobile app login + content management via proxy still works.
- Run security scan + linter; address any new findings.

---

## Out of scope (post-launch)
- Instagram + LinkedIn publishing (Meta IG requires the same App; LinkedIn needs separate developer setup + company page).
- Twitter/X publishing (paid API).
- Real Mobile App analytics dashboard.
- Year-End Giving campaign template.
- PPC Management & Website Builder modules (already labeled "Coming Soon" on landing).
- Full Google My Business integration beyond reviews (requires Google API verification, multi-week review).

---

## Estimated timeline (~7 working days, leaves buffer in your 2 weeks)

| Day | Work |
|---|---|
| 1 | Phase 1 (security + SEO fixes + hide stubs) |
| 2 | Phase 2 (GBP trim) + Phase 3.1 (social UI cleanup) + verify gbp-sync-reviews |
| 3-4 | Phase 3.2 (Facebook OAuth — depends on you creating the FB App and providing secrets) |
| 5 | Phase 3.3 (real Facebook publishing) |
| 6 | Phase 4 (polish) + Phase 5 QA pass |
| 7 | Buffer / fixes from QA |

Approve this plan and I'll execute Phase 1 immediately, then hit you for the Facebook App credentials when we reach Phase 3.2.