

## Goal
Add an inline in-app support chat directly on `/dashboard/support` — no floating widget, no third-party. Users (org members) start a thread with Causeio's support team; platform admins see and reply to all threads from the same page.

## How It Works

**For end users (org members):**
A "Chat with Support" panel embedded on the page shows their current support thread. They type, hit send, message is stored in Supabase. They see replies appear in real time.

**For platform admins (your support team):**
The same `/dashboard/support` page shows an additional "Support Inbox" section listing every open support thread across all orgs. Selecting one opens the conversation inline, where they can reply. Replies appear instantly to the user via Supabase Realtime.

No floating launcher. Everything lives inside the page card layout, so it can't conflict with the public chatbot widget.

## Database (new tables via migration)

**`support_threads`**
- `id`, `organization_id` (FK), `created_by` (user_id), `subject` (nullable), `status` (`open` | `closed`), `last_message_at`, `created_at`, `updated_at`
- RLS: org members can SELECT/INSERT their own org's threads; platform admins can SELECT/UPDATE all.

**`support_messages`**
- `id`, `thread_id` (FK), `sender_id` (user_id), `sender_role` (`user` | `support`), `content`, `created_at`
- RLS: org members can SELECT/INSERT messages on their org's threads; platform admins can SELECT/INSERT on all.
- Trigger: on INSERT, update parent thread's `last_message_at` and bump `status` to `open`.

Realtime enabled on `support_messages` so both sides get instant updates.

## UI Changes

**`src/pages/Support.tsx`** — replace the "Live Chat" card with an inline `<SupportChat />` panel (full-width card, ~500px tall, message list + input). Keep Email, Docs, Submit Request, FAQ cards.

**New `src/components/support/SupportChat.tsx`** — user-side panel:
- Loads current org's most recent open thread (or creates one on first send)
- Message list with user/support bubbles, timestamps
- Text input + Send button
- Subscribes to realtime inserts on `support_messages` for the thread

**New `src/components/support/SupportInbox.tsx`** — admin-side panel, only rendered when `usePlatformAdmin().isPlatformAdmin` is true:
- Left column: list of all threads (org name, last message preview, unread indicator, sorted by `last_message_at`)
- Right column: selected thread's messages + reply box
- Realtime subscription to all `support_messages`

Conditionally renders below the user chat panel on the same page.

## Notifications (lightweight, no push)
- Sidebar badge on "Support" nav item showing unread count for the user (or open-thread count for admins). Defer to a follow-up if you want to keep this round small — call it out and I'll skip it.

## Out of Scope (this round)
- Email notifications when a reply arrives
- File attachments
- Multiple subjects/threads per org (one open thread at a time keeps UX simple — can extend later)
- Mobile push

## Technical Notes
- Migration creates 2 tables, 2 enums (or text+check), RLS policies, and a trigger to update `last_message_at`.
- Realtime: enable replication on `support_messages` and add to `supabase_realtime` publication.
- Permissions reuse `is_org_member()` and `is_platform_admin()` — no new helpers needed.
- All UI uses existing shadcn `Card`, `Input`, `Button`, `ScrollArea`, `Avatar`.

