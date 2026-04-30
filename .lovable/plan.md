## Chatbot Builder Audit

I traced every piece of the chatbot stack: the dashboard, the builder/studio, settings, knowledge ingestion, FAQs, preview, embed/widget runtime, and the four edge functions (`chat-handler`, `process-knowledge`, `get-widget-config`, `track-event`, `submit-volunteer`). Below is what's working, what's broken, and what's hardcoded.

### Verdict

The chatbot builder is largely real and wired end-to-end. There is **no fake/seeded data**, all CRUD goes through Supabase, and the chat flow (sessions → messages → embeddings → OpenAI → usage logging) is genuine. However, there are real bugs and a few hardcoded values worth fixing.

---

## Bugs to fix

### 1. Volunteer Submissions metric is always 0 (real bug)
`ChatbotAnalytics.tsx` queries `chat_leads` filtered by `interest_type='volunteer'`, but the volunteer dialog actually writes to the `volunteers` table via `submit-volunteer`. Nothing ever populates `chat_leads`.

**Fix:** Change the query to `volunteers` joined by `chatbot_id` (the table already has `chatbot_id`), or count `chatbot_events` where `event_type='volunteer_submitted'`. Either is one query and returns real data.

### 2. "Total Conversations" stat on dashboard shows literal `-`
`ChatbotDashboard.tsx` renders `<p>-</p>` for Total Conversations. Hardcoded placeholder.

**Fix:** Aggregate `chat_sessions` count grouped by `chatbot_id` for the org, or remove the card.

### 3. "Edit" button on dashboard ignores which chatbot you clicked
`ChatbotDashboard.tsx` Edit button just calls `setShowBuilder(true)` and discards the chatbot id, dumping the user back into the builder list instead of the studio for that chatbot.

**Fix:** Lift selection state — pass an `initialChatbotId` into `ChatbotBuilder` and pre-select it in the studio.

### 4. Welcome message never appears for real visitors
`ChatbotPreview.tsx` seeds `messages[0]` with the welcome message, but the actual `ChatbotWidget` (used on the customer's site) starts empty — `useChatbot` only loads persisted history. Real visitors see a blank chat panel until they type.

**Fix:** In `ChatbotWidget`, if `messages.length === 0` and no persisted session, prepend a synthetic assistant welcome message from `chatbot.brand_settings.welcome_message`.

### 5. `primary_color` from settings is never used in the widget UI
The header bar uses `brandColors.primary` but the user message bubbles and Send button use `brandColors.accent`. The "Primary Color" label in settings is misleading because the visible chat color is actually the accent. Also embed.js accepts `data-primary-color` / `data-accent-color` overrides, but `StandaloneWidget` only patches `brand_settings` — fine — but `ChatbotPreview`'s embed snippet hardcodes `'#0066CC'` / `'#00AA44'` as fallbacks which can mislead users into thinking those colors are set.

**Fix:** Either remove the fallback colors from the generated embed snippet (let the saved config drive it) or document that they only override.

### 6. `chatbot_events` are inserted from the browser without a session in some paths
`StandaloneWidget.trackEvent` calls `track-event` without `sessionId`, while `ChatbotWidget` passes `onTrackEvent` that also drops `sessionId`. Events land but can't be correlated to a session. Minor, but the `eventStats` breakdown on the analytics tab loses fidelity.

**Fix:** Thread `sessionId` (from `useChatbot`) into `onTrackEvent` in `ChatbotWidget` and `StandaloneWidget`.

### 7. `useChatbot.loadChatHistory` re-runs on first open even when session is fresh
After `sendMessage` creates a session, `setSessionId` triggers the `useEffect` that auto-loads history (which is already loaded). Cosmetic; double-fetch on first message.

**Fix:** Track an `initializedSessions` ref or skip load if `messages.length > 0`.

### 8. Rate limit map in `chat-handler` keys on IP only
With the same office IP, all visitors share a 30/min cap. Acceptable for now but worth noting — switch to `ip + chatbotId` or `ip + sessionId`.

### 9. `process-knowledge` URL ingestion is a naive HTML strip
Lines 65–73 do `.replace(/<[^>]*>/g, ' ')` instead of using Firecrawl (which is configured as a connector secret). For non-trivial sites this captures nav/cookie banners as knowledge.

**Fix:** Call Firecrawl `/scrape` (key already in env) when `type==='url'`. Falls back to current behavior on failure.

### 10. No size cap on knowledge content sent to OpenAI
`chat-handler` falls back to dumping every completed `knowledge_sources.content` joined into the system prompt when vector retrieval fails or returns nothing (lines 222–239). For an org with many sources this can blow past the model context window and cost.

**Fix:** Truncate `contextContent` to ~12k characters before constructing `openAIMessages`.

---

## Hardcoded values found (verify these are intentional)

| Where | Value | Note |
|---|---|---|
| `chat-handler/index.ts:269` | `model: 'gpt-4o-mini'` | Hardcoded; not configurable per chatbot |
| `chat-handler/index.ts:271` | `max_tokens: 1000`, `temperature: 0.7` | Hardcoded |
| `chat-handler/index.ts:185` | `text-embedding-3-small` | Hardcoded |
| `process-knowledge/index.ts:100` | `chunkText(..., 1000)` | 1000 char chunks |
| `process-knowledge/index.ts:110` | `text-embedding-3-small` | Hardcoded |
| `chat-handler/index.ts:194-195` | `match_count: 6, similarity_threshold: 0.3` | RAG retrieval config hardcoded |
| `chat-handler/index.ts:26-27` | `RATE_LIMIT_WINDOW=60s`, `MAX=30` | Hardcoded |
| `KnowledgeUpload.tsx:306` | `maxSize = 20MB` | Hardcoded file cap |
| `ChatbotBuilder.tsx:34-35` and `ChatbotSettings.tsx:53-54` | `'#0066CC'` / `'#00AA44'` | Default brand colors |
| `get-widget-config/index.ts:83` | `Cache-Control: max-age=300` | 5-min cache means published config edits take up to 5 min to propagate to embedded widgets |

These aren't bugs, but worth surfacing — none of them are user-configurable today.

---

## What's working correctly

- Create / update / delete of chatbots with quota enforcement (`enforce_chatbot_quota` trigger) ✓
- Knowledge sources: text, URL, PDF, DOCX uploads → storage → `process-knowledge` → embeddings → `match_knowledge_chunks` RPC ✓
- FAQs: full CRUD via React Query + `chatbot_faqs` table ✓
- Chat session persistence in localStorage keyed by chatbot id ✓
- BYO OpenAI key path via Supabase Vault ✓
- Per-org monthly cap with override support, `cap_reached` 429 surfacing in `useChatbot` ✓
- Usage logging to `ai_usage_events` for both embeddings and chat completions ✓
- `submit-volunteer` writes to `volunteers`, tracks event, and triggers CRM sync ✓
- Embed flow: `embed.js` → `widget.umd.js` → `StandaloneWidget` → `get-widget-config` (active-only) ✓
- Analytics: real `chat_sessions`, `chat_messages`, `chatbot_events` queries with CSV export ✓

---

## Proposed implementation order (when approved)

1. Fix Volunteer Submissions analytics query (table swap)
2. Replace `-` placeholder on dashboard with real conversations count
3. Fix Edit button to deep-link into the correct chatbot's studio
4. Inject welcome message into `ChatbotWidget` when no history exists
5. Truncate knowledge context in `chat-handler` to protect against runaway prompts
6. Switch URL ingestion in `process-knowledge` to Firecrawl with regex fallback
7. Pass `sessionId` through `onTrackEvent` in widget paths
8. Drop misleading hardcoded color fallbacks from the generated embed snippet

Items 1–4 are small and high-impact; 5–8 are quality improvements. Approve and I'll implement in the same order.
