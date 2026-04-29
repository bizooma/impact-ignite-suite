## Bug confirmed: AI tier caps differ between frontend and backend

The frontend (`src/lib/aiTierLimits.ts`) and backend (`supabase/functions/chat-handler/index.ts`) declare different monthly chat-message caps. The backend is the actual enforcement point, so users see one number in the UI but get a different real limit. You chose **frontend values** as the source of truth.

### Target caps (single source of truth)

| Tier | Monthly chat-message cap |
|---|---|
| free | 0 (blocked — must upgrade or BYO key) |
| starter | 50 |
| professional | 1,000 |
| enterprise | 5,000 |

### Changes

1. **`supabase/functions/chat-handler/index.ts`** — update `TIER_CAPS` to match the frontend:
   ```ts
   const TIER_CAPS: Record<string, number> = {
     free: 0,
     starter: 50,
     professional: 1_000,
     enterprise: 5_000,
   };
   ```
   Update the `// keep in sync` comment to point at `src/lib/aiTierLimits.ts` as the canonical source.

2. **Deploy `chat-handler`** so the new caps take effect immediately.

3. **No other code changes needed.** Verified call sites:
   - `src/components/admin/AIUsageDashboard.tsx`, `src/pages/Pricing.tsx`, `src/pages/PricingBeta.tsx` already read from `TIER_LIMITS` in `aiTierLimits.ts` — they'll be correct automatically.
   - `org_ai_usage_overrides.monthly_message_cap` per-org overrides continue to take precedence in both places.
   - Quantity caps (chatbots, qr_codes, etc.) live in the DB `tier_limit()` function and are unrelated to this bug — leaving them alone.

### Behavior impact (heads-up)

- **Free tier** chat goes from "actually 50/mo" to "0/mo, blocked" on the backend. Free users will be hard-blocked from chatbot messages until they upgrade or add a BYO OpenAI key. The UI was already showing this state, so it just becomes truthful.
- **Starter** real cap drops 1,000 → 50. Any starter org that has already sent more than 50 messages this calendar month will be blocked for the rest of the month. If you'd rather grandfather them, I can add a one-time `org_ai_usage_overrides` row for affected orgs after the change — say the word.
- **Professional** drops 5,000 → 1,000. Same risk for heavy users this month.
- **Enterprise** drops 25,000 → 5,000. Same risk.

If any of those drops feel too aggressive, reply with adjusted numbers before approving and I'll use those instead.

### Follow-up suggestion (not in this change)

To prevent this drift from recurring, the backend should import caps from a shared location instead of redeclaring them. Options for a future pass: (a) read caps from a small `tier_caps` table, or (b) extend the existing DB `tier_limit()` function with a `'monthly_messages'` resource and have both frontend and edge function read from it. Happy to do that as a follow-up — not included here to keep this fix minimal.