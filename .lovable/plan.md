
User wants:
1. Per-org AI usage tracking (count messages/tokens per billing period)
2. Hard caps tied to pricing tier — block when exceeded
3. Per-org BYO OpenAI key option (not just enterprise) accessible in admin settings

Key design decisions:
- Track in a new `ai_usage` table, aggregate per org per month
- Tier limits: Starter / Professional / Enterprise — read from org subscription tier (already have `check-subscription` mapping)
- Hard ceiling enforced in `chat-handler` BEFORE calling OpenAI
- BYO key stored encrypted in `integrations` table (existing pattern, like Stripe Connect) — when present, usage is metered but NOT capped (their dime)
- Settings UI: new section in org admin area

Let me check existing settings UI structure briefly... I have enough context already from the file list (`MembershipManagement`, `OrganizationManagement`, `StripeConnectSettings` pattern). The Stripe Connect settings is the perfect template — `integrations` row + edge function for save/test/delete.

Keep plan concise.
