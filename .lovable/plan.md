## Why you're seeing the limit

Both **Bizooma** orgs (`Bizooma` and `Bizooma Foundation`) are on the **`free`** subscription tier in the database:

```
subscription_tier: free
purchased_products: [qr_codes, seo_audits, accessibility, tasks]
```

In `src/lib/aiTierLimits.ts`, the `free` tier has `monthlyMessageCap: 0` — meaning zero chat messages allowed. The `chat-handler` edge function reads `chatbot.organizations.subscription_tier`, looks up the cap, and returns `cap_reached` immediately because `0 >= 0`.

There is **no platform-admin bypass** in `chat-handler`. Platform admin status is only checked in the frontend (`useTierLimits`, `useProductAccess`) for things like create-buttons — the server-side edge function ignores it. So even though you're a platform admin, the org's tier still gates AI usage.

There's also no per-org override row in `org_ai_usage_overrides` for either Bizooma org.

## The fix

Three layers of defense so this doesn't bite again:

### 1. Platform-admin org bypass in `chat-handler`

In `supabase/functions/chat-handler/index.ts`, after fetching the chatbot/org, check whether **any owner/admin of the org is a platform admin** (via the existing `user_roles` table with role `super_admin` / platform admin). If yes, skip the cap check entirely — same semantics as the frontend `usePlatformAdmin` hook.

Implementation:
- Query `user_roles` joined to `organization_members` for the org, looking for any member whose user_id has the platform-admin role.
- If found, set `usingByoKey`-style bypass flag `isPlatformOrg = true` and skip the cap block.
- Still log usage to `ai_usage_events` for observability (just don't enforce).

### 2. Set Bizooma orgs to a higher tier (or add an override)

Two options — pick one:

- **Option A (recommended):** bump both Bizooma orgs to `enterprise` tier so they get all product bundles + uncapped messages. Migration:
  ```sql
  UPDATE organizations
  SET subscription_tier = 'enterprise'
  WHERE id IN ('d3751758-bf07-4bbe-a78b-661ae87f1f32',
               'e16eaa0d-a6c3-4ee1-ae47-e4ef53a850d0');
  ```
  Note: per the billing memory, `check-subscription` syncs `purchased_products` from Stripe — since these orgs aren't paying Stripe customers, the manual tier won't get reset unless they later subscribe. Acceptable for internal orgs.

- **Option B:** insert rows in `org_ai_usage_overrides` with a very high `monthly_message_cap` (e.g. 1,000,000). Less invasive but doesn't unlock product bundles.

### 3. Better error message

When `cap_reached` returns for the org owner / a platform admin testing in-app, surface a clearer message in `ChatInterface` / `ChatbotWidget` ("Your org's tier (free) doesn't include AI chat — upgrade to Starter+") instead of the generic "contact site owner" wording.

## Files touched

- `supabase/functions/chat-handler/index.ts` — add platform-admin org bypass
- New migration — bump Bizooma orgs to `enterprise` (Option A)
- `src/components/chatbot/ChatInterface.tsx` (or wherever the cap_reached toast lives) — friendlier error for in-dashboard testers

## Out of scope

- Changing the `free` tier cap globally (intentionally 0 to gate the upgrade funnel).
- Stripe sync logic.

Approve and I'll implement.