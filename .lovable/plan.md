
## Chatbot Builder Audit — Findings & Fix Plan

### 🔴 Critical bugs (break real functionality)

1. **Knowledge sources never become usable.** The `knowledge_source_status` enum has values `pending | processing | completed | error`, but `process-knowledge` writes status `'processed'` and `'failed'` — neither exists, so the update silently fails. Then `chat-handler` filters knowledge with `.eq('status', 'processed')` — also wrong. **Result: every URL/text source stays "pending" forever and no knowledge ever reaches the AI.** Fix: standardize on `completed`/`error` everywhere, and fix the `KnowledgeUpload` list display which uses neither value consistently.

2. **`process-knowledge` error handler is broken.** It calls `req.json()` *three times* in the catch block (already-consumed stream) — the failure-status update never runs, leaving sources stuck mid-processing.

3. **File upload tab is a dead placeholder.** Says "coming soon" with a non-functional "Choose Files" button. Either wire it up to the existing `knowledge-sources` storage bucket or remove the tab.

4. **Duplicate `TabsContent value="knowledge"` in `ChatbotBuilder`** (lines 352 & 356). React renders only one — the FAQ Manager is currently unreachable from the studio.

### 🟡 Mock/placeholder data to remove

5. **`ChatbotPreview` uses fake AI replies.** `handleSendMessage` is a `setTimeout` that returns a hardcoded string — should call the real `chat-handler` edge function so users actually test their bot.
6. **`ChatbotPreview` "Quick Stats" card** is hardcoded (`0`, `0`, `100%`, `N/A`). Either fetch real numbers or delete the card (analytics tab already covers it).
7. **`ChatbotPreview` widget badges** only handle `bottom-right`/`bottom-left` and `light`/`dark` — show wrong labels for `middle-*` and other settings.
8. **`ChatbotPreview` "Open in New Window"** button does nothing. Wire it to `/embed-preview/<chatbotId>` or remove it.
9. **`ChatbotAnalytics` fake trend deltas** (`+12%`, `+8%`, `+15%`, `+5%`) are hardcoded strings — replace with real period-over-period comparison or remove the badges.
10. **`ChatbotAnalytics` "Avg. Session Duration: 3.2 min"** is hardcoded — compute from `chat_messages` timestamps per session, or remove the row.
11. **`ChatbotAnalytics` "Messages Exchanged"** uses `message_sent * 2` as a proxy — query `chat_messages` directly via session join.
12. **`ChatbotAnalytics` Export button** does nothing — wire to CSV download or remove.

### 🟠 UX / consistency issues

13. **"New Chatbot" button always shows the create form** even when a bot is selected — fine, but the create form has no cancel/edit-existing path. Selecting a bot drops you into Studio with no way to edit its name/description/tone (only widget settings). Add an "Edit Basics" section to `ChatbotSettings`.
14. **`ChatbotPreview` reloads the page** after toggling status (`window.location.reload()`) — should just re-fetch via the hook.
15. **Status badge mismatch**: code uses `'paused'` in some places (per types file) but DB enum is `draft | active | paused`. Verify enum and align UI.
16. **`useChatbot` hook (singular)** is separate from `useChatbots` and uses different message types — the preview should use the same hook so behavior matches production embed.

### Fix plan (when approved)

**A. Database / edge functions**
- Migration: no schema change needed — enum is fine.
- Update `process-knowledge`:
  - Write `status: 'completed'` (not `'processed'`) and `'error'` (not `'failed'`).
  - Fix the catch block: capture `knowledgeSourceId` once at the top of `try`, reuse in catch.
  - Add a try/catch around URL fetch that marks the source `error` with a metadata message instead of throwing generically.
- Update `chat-handler`: filter knowledge with `.eq('status', 'completed')`.

**B. Front-end**
- `KnowledgeUpload`: remove "coming soon" file tab OR implement file upload to `knowledge-sources` bucket + invoke `process-knowledge` with `type: 'file'` (recommend implementing — bucket already exists). Fix status icon/color map (use `completed`/`error`).
- `ChatbotBuilder`: delete the duplicated `TabsContent` so FAQ Manager renders.
- `ChatbotPreview`: 
  - Replace the simulated AI reply with a real call to `chat-handler` (use the `useChatbot` hook).
  - Remove or wire up Quick Stats (recommend remove — duplicates Analytics).
  - Fix widget config badges to display all enum values.
  - Remove or implement "Open in New Window" (open `/widget-preview/<id>` route).
  - Replace `window.location.reload()` with hook refetch.
- `ChatbotAnalytics`: 
  - Remove hardcoded trend percentages (or compute real ones from previous-period query).
  - Replace "Avg. Session Duration: 3.2 min" with a real query (or remove row).
  - Replace `message_sent * 2` with `chat_messages` count joined by session.
  - Wire Export button to download a CSV of events for the selected period.
- `ChatbotSettings`: add an "About" section with editable `name`, `description`, so users can edit basics after creation.

**C. QA after changes**
- Create a chatbot → add a URL knowledge source → verify status flips to `completed`.
- Open Preview → send a message → confirm real AI response using the knowledge.
- Add a FAQ → verify it appears in the Knowledge tab.
- Open Analytics → confirm all numbers are real (no hardcoded percentages).

### Out of scope (call out for user decision)
- Embedding-based retrieval (`knowledge_embeddings` is populated but `chat-handler` only does naive concat of all source text — works but doesn't scale past a few sources). Worth a separate task.
- File parsing for PDF/DOCX (requires a parsing library in the edge function).

### Estimated work
Roughly **6 file edits + 1 edge function migration + 1 frontend hook reuse** — about one focused implementation pass. No DB schema changes required.
