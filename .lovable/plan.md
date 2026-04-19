
User picked Option A: add a visible Free Forever tier and fix misleading trial CTAs.

Plan scope:
1. Pricing page — add 4th column for Free, switch grid to 4 cols on lg (3 cols stays jammed). Update CTAs on paid tiers from "Start Free Trial" to "Get Started" and remove "No credit card required / 14-day free trial" hero copy.
2. Free tier card: $0/mo, 50 AI messages/mo, 1 chatbot, 5 QR codes, 1 social account, community support, basic analytics. CTA "Get Started Free" → /auth (no Stripe).
3. Add Free product schema to JSON-LD array; update FAQ to remove "free trial" mention, replace with "free forever plan" answer.
4. Add a 4th pricingSchemas entry for Free.

No DB or edge function changes. Pure frontend edit to `src/pages/Pricing.tsx`.

Keep concise.
