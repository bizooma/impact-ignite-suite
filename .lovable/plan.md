
User wants Option 1 architecture (Shared Identity + App Switcher) sketched out in detail. They're asking specifically whether a new database is needed. This is a research/design question, not an implementation task — so I'll present a design document rather than a build plan. Key things to cover:

1. Answer the database question directly (yes — a small new shared identity DB, OR reuse one platform as the identity host)
2. Data model for shared identity
3. Auth flow (SSO via Supabase magic link tokens or OAuth)
4. App switcher UI
5. A simple architecture diagram

I'll produce a Mermaid diagram artifact for the architecture and inline the data model + flow. Keep it concrete and reference-quality since they said "so I have something concrete to reference."
