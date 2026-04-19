
## Why Mailchimp isn't working

Two distinct issues, with the second being the showstopper:

**1. The "Test" button on Integrations dashboard calls a non-existent function** — `useIntegrations.testIntegration` invokes `test-integration`, but no such edge function exists. Only `test-mailchimp-connection` (Mailchimp-specific) and provider-specific functions exist. This is the "Failed to fetch" / "Integration test failed" error in your console logs and session replay. As a result the integration's status is stuck at `error` in the DB even though the API key (`...-us14`) looks valid.

**2. The actual Mailchimp sync flow is broken** — `MailchimpMappingDialog` lets you configure a mapping, but for sync to work it needs `crm_mailchimp_mappings` rows. Sync runs via `sync-crm-to-mailchimp`, which reads `integration.encrypted_tokens.api_key` (✅ present in your DB) and pushes contacts. The pipeline itself is fine — but it never gets exercised because users see "Test failed" on the Integrations page and assume the integration is broken, so they never set up a mapping in the CRM → Mailchimp Sync tab.

**3. Minor:** `test-mailchimp-connection` has `verify_jwt = true` but is called from the dialog with an api_key in the body. That's OK as long as the user is logged in. Not the cause here.

## Fix plan

**A. Create a generic `test-integration` edge function** that:
- Loads the integration row by `integrationId`
- Switches on `provider`:
  - `mailchimp` → ping `https://{dc}.api.mailchimp.com/3.0/ping` with the stored `api_key`
  - Other providers → return "test not implemented" gracefully (so future providers can be added)
- Returns `{ success, account?, error? }` with proper CORS headers
- Reuses the existing pattern from `test-mailchimp-connection`

**B. Update `useIntegrations.testIntegration`** to handle the new response shape and only mark `status: 'active'` when `success === true` (currently it marks active on any non-error response).

**C. Update `IntegrationsDashboard.handleTest`** to surface a clearer toast when the test returns a Mailchimp-specific failure (e.g., bad key, wrong datacenter) instead of just a generic "Integration test failed".

**D. After fix, re-run "Test" on your existing Mailchimp integration** to flip its status from `error` → `active`. Then go to **CRM → Mailchimp Sync** to create a mapping and run a sync.

## Files to change

- `supabase/functions/test-integration/index.ts` — new
- `supabase/config.toml` — add `verify_jwt = true` for `test-integration`
- `src/hooks/useIntegrations.ts` — read `data.success`, return error properly
- `src/components/integrations/IntegrationsDashboard.tsx` — better error toast in `handleTest`

No DB migrations needed. The Mailchimp API key already in `integrations.encrypted_tokens` looks correctly formatted.
