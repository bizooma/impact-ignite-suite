
## Add Organization Name to Signup Flow

Right now, signing up creates an auth user but no organization — users land in a "Welcome to Causeio / Create Organization" gate (handled by `DashboardLayout`) before they can access anything. Better UX: collect the org name during signup and provision the org immediately.

### What will change

**1. Auth signup form (`src/pages/Auth.tsx`)**
- Add an "Organization Name" field (required) to the sign-up form, placed between "Full name" and "Email".
- Keep the sign-in form unchanged.
- Pass the org name through to the signup handler.

**2. Auth hook (`src/hooks/useAuth.tsx`)**
- Extend `signUp(email, password, displayName, organizationName)` to accept the org name and stash it in `options.data.organization_name` (so it's available in the user's metadata after email confirmation).

**3. Auto-provision org on first login (`src/hooks/useOrganization.tsx`)**
- After `fetchOrganizations()` runs and finds zero memberships, check `user.user_metadata.organization_name`. If present, auto-create the org (reusing existing `createOrganization` logic with a slugified name) and clear the metadata flag so it only runs once.
- This handles both flows: instant signup (no email confirmation) and delayed signup (after the user clicks the confirmation email).

**4. Fallback gate (`src/components/layout/DashboardLayout.tsx`)**
- Leaves the existing "Create Organization" dialog as a fallback for any edge cases (e.g., metadata missing, provisioning failed, or legacy users), so nobody gets stuck.

### Why this approach
- Org name is captured up front → no awkward second step after signup.
- Auto-provision runs client-side on first authenticated load, so it works even if Supabase email confirmation is enabled (the metadata persists across the confirmation redirect).
- Slug is auto-generated from the org name (lowercased, dash-separated). If a slug collides, append a short random suffix.
- No DB migration needed — uses existing `organizations` + `memberships` tables and the existing `createOrganization` flow.

### Files to edit
- `src/pages/Auth.tsx` — add Organization Name input to signup form
- `src/hooks/useAuth.tsx` — accept + forward `organizationName` in `signUp`
- `src/hooks/useOrganization.tsx` — auto-create org from user metadata on first load
