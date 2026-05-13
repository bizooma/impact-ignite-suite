## Goal

Fix the signup → org workflow so the organization name entered on `/auth` is the one used (no second "Create Organization" prompt), and so invited team members never see the org-name field at all.

## Current behavior

- `/auth` always requires `organizationName` on signup, even for invited users.
- `useAuth.signUp` stashes `organization_name` in user metadata.
- `useOrganization.autoProvisionOrg` is supposed to create the org from that metadata after login, but the user still lands on `DashboardLayout`'s "Create Organization" card asking for it again.
- Invited users (with `?invite=…`) currently still get the org-name input, which is wrong — they join an existing org via `accept-invitation`.

## Changes

### 1. `src/pages/Auth.tsx`
- Make `organizationName` conditional in the Zod schema and form: required only when there is **no** `inviteToken` / `inviteEmail`.
- Hide the "Organization name" input entirely when accepting an invite.
- Pass `organizationName` to `signUp` only when not an invite.
- Update copy under the invite header to make clear they're joining an existing org.

### 2. Server-side, reliable org provisioning
Replace the client-side `autoProvisionOrg` race-prone path with an edge function modeled after `provision-beta-org`:

- New edge function `provision-org` (`supabase/functions/provision-org/index.ts`):
  - Auth-required; reads `organizationName` from body (fallback to `user_metadata.organization_name`).
  - Idempotent: if the user already owns any org, return it.
  - Uses service role to insert into `organizations` (unique slug w/ retry) and `memberships` with `role: 'owner'`.
  - Clears `user_metadata.organization_name` after success.
- Register in `supabase/config.toml` with `verify_jwt = true`.

### 3. `src/hooks/useOrganization.tsx`
- Replace the inline `autoProvisionOrg` block in `fetchOrganizations` with a call to `supabase.functions.invoke('provision-org', { body: { organizationName: pendingOrgName } })`, then refetch.
- Only invoke when the user has zero memberships **and** has a pending org name in metadata.
- Keep `setLoading(false)` ordering correct so `DashboardLayout` doesn't flash the "create org" card.

### 4. `src/components/layout/DashboardLayout.tsx`
- Keep the "Welcome to Causeio / Create Organization" card as a true fallback (no metadata, no membership, not invited) — but it should now be unreachable for normal owner/admin signup and for invited members.
- Add a brief loading state if `user_metadata.organization_name` is present but provisioning hasn't finished yet, instead of jumping straight to the create-org form.

### 5. Invited-member path (no code in `Auth.tsx` beyond #1)
- `accept-invitation` already creates the membership against the inviter's org, so once `useOrganization.fetchOrganizations` runs they see that org. No org-name prompt, no auto-provision.

## Out of scope

- Billing/seat checks (already covered by the existing rule that owners pay; this plan just makes sure invited members never get prompted to create an org).
- UI redesign of the auth or dashboard cards beyond the conditional field.

## Technical notes

- Edge function uses `SUPABASE_SERVICE_ROLE_KEY` server-side only; frontend invoked with the user's JWT.
- Slug generation mirrors `provision-beta-org` (slugify + collision retry).
- New owners are created with `role: 'owner'` (matches existing `memberships.role` enum usage).
- No DB migration required — uses existing `organizations` and `memberships` tables.
