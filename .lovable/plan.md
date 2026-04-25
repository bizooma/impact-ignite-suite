# Facebook Per-Tenant OAuth & Publishing — Full Build

Build the complete per-organization Facebook integration end-to-end. The code will read `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` from Supabase secrets — once you add those (after creating the FB App on a different computer), the flow goes live with zero additional code changes.

## Architecture

Standard OAuth 2.0 Authorization Code flow, scoped per organization:

```
[Org Admin] → clicks "Connect Facebook" in SocialIntegrationsPanel
   ↓
[facebook-oauth-start] → generates CSRF state → 302 to facebook.com/dialog/oauth
   ↓
[Facebook] → user logs in, picks Pages, grants permissions
   ↓
[facebook-oauth-callback] → exchanges code → long-lived user token → fetches Pages → stores per-Page tokens in `integrations` (one row per Page, scoped to organization_id) → 302 back to /dashboard/social?fb=connected
   ↓
[social-publisher] → on publish, looks up the org's active Facebook integration → POSTs to graph.facebook.com/{page_id}/feed using stored Page Access Token
```

## Files to create/edit

### 1. NEW: `supabase/functions/facebook-oauth-start/index.ts`
- Validates caller JWT, requires `organization_id` query param
- Verifies caller has `admin` or `owner` role on that org via `has_org_role` RPC
- Generates a CSRF `state` token (random + signed JSON: `{ org_id, user_id, nonce, exp }`), HMAC'd with `SUPABASE_JWKS` or `SUPABASE_SERVICE_ROLE_KEY`-derived key
- Returns `{ authorize_url }` JSON pointing to:
  ```
  https://www.facebook.com/v19.0/dialog/oauth
    ?client_id={FACEBOOK_APP_ID}
    &redirect_uri={SUPABASE_URL}/functions/v1/facebook-oauth-callback
    &state={signed_state}
    &scope=pages_show_list,pages_manage_posts,pages_read_engagement,business_management
    &response_type=code
  ```

### 2. NEW: `supabase/functions/facebook-oauth-callback/index.ts`
- Public endpoint (no JWT — Facebook calls it). Reads `code` and `state` from query.
- Verifies HMAC on `state`, checks `exp`, extracts `org_id` and `user_id`
- Exchanges `code` → short-lived user token: `GET graph.facebook.com/v19.0/oauth/access_token`
- Exchanges short-lived → long-lived (~60-day) user token: `GET .../oauth/access_token?grant_type=fb_exchange_token`
- Fetches user's Pages: `GET graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,category,picture`
- For each Page, upserts a row in `integrations`:
  - `organization_id`, `provider='facebook'`, `status='active'`
  - `config = { page_id, page_name, account_name, category, picture_url }`
  - `encrypted_tokens = { page_access_token, user_access_token, user_token_expires_at }`
  - Note: Page Access Tokens are long-lived (don't expire) when derived from a long-lived user token
- 302 redirects to `${origin}/dashboard/social?fb=connected&pages={count}`
- On error → 302 to `/dashboard/social?fb=error&reason={msg}`

### 3. REWRITE: `supabase/functions/social-publisher/index.ts`
- Validates JWT, verifies caller can access the post's org
- Fetches the post (must be `platform='facebook'`)
- Looks up the matching `integrations` row (org + provider=facebook + status=active)
  - If multiple Pages, uses `post.config.page_id` if specified, else first active
- POSTs to Graph API:
  ```
  POST graph.facebook.com/v19.0/{page_id}/feed
    body: { message: post.content, access_token: page_access_token }
  ```
  - With `media_urls`: posts to `/{page_id}/photos` (single) or creates unpublished photos + attached_media (multi-image)
- On success: updates `social_posts` with `status='published'`, `published_at`, `external_post_id={page_id}_{post_id}`
- On error: updates `status='failed'`, `error_message`, returns 500 with details
- Removes ALL simulation code

### 4. EDIT: `src/components/social/SocialIntegrationsPanel.tsx`
- Replace `handleConnect` stub with real flow:
  ```ts
  const { data, error } = await supabase.functions.invoke('facebook-oauth-start', {
    body: { organization_id: organizationId }
  });
  if (data?.authorize_url) window.location.href = data.authorize_url;
  ```
- Replace `handleDisconnect` with real `deleteIntegration(integration.id)` call + confirmation dialog
- Add a "Reconnect" button that runs the same OAuth start flow (overwrites tokens)
- Show connected Page name + picture from `integration.config`

### 5. EDIT: `src/components/social/SocialMediaDashboard.tsx`
- Read `?fb=connected` / `?fb=error` query params on mount via `useSearchParams`
- Show success toast: "Facebook Page connected — N page(s) available for posting"
- Show error toast with reason on failure
- Strip the params from URL after handling

### 6. EDIT: `src/components/social/PostComposer.tsx`
- If org has multiple connected FB Pages, add a Page selector dropdown (defaults to first)
- Pass `page_id` into `createPost` so publisher knows which Page to target
- Disable submit with helpful tooltip if no FB Page connected

### 7. EDIT: `src/hooks/useSocialPosts.ts`
- `createPost` accepts optional `page_id` → stored in `social_posts.config` (JSONB) or new column
- May require small migration: add `target_page_id text` to `social_posts` (nullable)

### 8. Migration (if needed)
- Add `target_page_id text NULL` to `social_posts` so multi-Page orgs can pick which Page to publish to
- No RLS changes needed — existing `social_posts` policies cover it
- Confirm `integrations.provider` enum includes `'facebook'` (it does per the existing `enforce_integration_quota` function)

## Secrets needed (you add later)

When you finally get into the FB Developer console:
- `FACEBOOK_APP_ID` — from FB App Settings → Basic
- `FACEBOOK_APP_SECRET` — same screen, click "Show"

I'll request both via the secure secrets form when you say you're ready. Until then, the OAuth start function will return a clear "Facebook integration not yet configured by platform admin" error — but all the wiring, UI, callback, and publisher code will be live.

## What works immediately after this build

- ✅ All edge functions deployed and live
- ✅ "Connect Facebook" button wired and clickable (will show "not configured" error until secrets added)
- ✅ OAuth callback handler ready to receive Meta's redirect
- ✅ Real Graph API publishing logic in `social-publisher` (no more simulation)
- ✅ Disconnect/reconnect flows functional
- ✅ Multi-Page support in UI
- ✅ Success/error feedback in dashboard

## What activates once you add `FACEBOOK_APP_ID` + `FACEBOOK_APP_SECRET`

- 🚀 The full Connect → Authorize → Publish loop, end-to-end, for any org

## Out of scope (deliberately deferred)

- Meta App Review submission (you handle externally; required to allow non-Tester FB accounts to connect)
- Webhook subscriptions for FB Page events (not needed for publishing)
- Long-lived token auto-refresh cron (Page tokens are effectively permanent; user tokens refresh next time admin reconnects)
- Instagram/LinkedIn/Twitter (still hidden per prior plan)

## Pre-launch QA (after secrets added)

1. Connect FB Page from Bizooma org → verify `integrations` row created with correct `page_id`
2. Compose post → publish → verify it appears on the actual FB Page
3. Verify `social_posts.external_post_id` populated and `status='published'`
4. Disconnect → verify integration row deleted, button reverts to "Connect"
5. Try connecting from a different org → verify tokens scoped correctly (no cross-org leakage)

---

**Approve to build everything except the FB App creation itself. You'll just add the two secrets later and it goes live.**