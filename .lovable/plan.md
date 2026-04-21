

## Goal
Notify you of new user support messages via two channels: **email** (works anywhere) + **browser push notifications** (instant, while Causeio is open in any tab).

## How It Works

**Email (A):** When a user posts a support message, a database trigger calls a new edge function that sends you an email through Lovable's built-in email system. You get one email per user message at your configured address. No emails for your own admin replies.

**Browser Push (B):** On the `/dashboard/support` page (and anywhere `SupportInbox` mounts for platform admins), a "Enable desktop notifications" toggle requests browser permission. Once granted, the existing Supabase Realtime subscription on `support_messages` fires a native OS notification ("New support chat from [Org Name]") whenever a `user`-role message arrives. Click the notification → focuses the Causeio tab and selects that thread.

## Changes

### 1. Email infrastructure (one-time setup)
- Set up Lovable's email domain + queue infrastructure (you'll complete a short DNS setup dialog).
- Scaffold a transactional email template `new-support-message.tsx` with subject "New support chat from [Org Name]" and body containing org name, sender info, message preview, and a button linking to `/dashboard/support`.
- Recipient address stored in a new secret `SUPPORT_NOTIFY_EMAIL` (your email).

### 2. Edge function: `notify-support-message`
- `verify_jwt = false`, protected by `x-notify-secret` header validated against new `SUPPORT_NOTIFY_SECRET`.
- Receives `{ thread_id, message_id, sender_role, organization_id, content }` from the DB trigger.
- Skips if `sender_role = 'support'`.
- Looks up org name, then invokes `send-transactional-email` with template `new-support-message`, idempotency key `support-msg-${message_id}`.

### 3. Database migration
- Enable `pg_net` extension (if not already).
- Add Vault secrets for the function URL + `SUPPORT_NOTIFY_SECRET`.
- Trigger function `notify_support_message_on_insert()` on `support_messages` AFTER INSERT — fires only when `sender_role = 'user'`, calls the edge function async via `net.http_post`.

### 4. Browser push UI (`SupportInbox.tsx`)
- Add a "Desktop notifications" toggle (shadcn `Switch`) at the top of the inbox card. Persists permission state in `localStorage`.
- On toggle ON: calls `Notification.requestPermission()`. Shows toast on grant/deny.
- In the existing realtime `INSERT` subscription, when a new message arrives with `sender_role = 'user'` AND notifications are enabled AND permission is granted: fire `new Notification('New support chat from ' + orgName, { body: messagePreview, icon: '/favicon.ico', tag: thread_id })`.
- `notification.onclick` → `window.focus()` + select that thread in the inbox.

### 5. Skip noise from your own activity
- Email trigger filters by `sender_role = 'user'` at the DB level (no SMS/email for admin replies).
- Browser push subscription also filters client-side.

## Setup Required From You (after approval)
1. Complete the email domain setup dialog (one-time DNS — required for sending).
2. Provide your notification email address (stored as `SUPPORT_NOTIFY_EMAIL`).
3. After deploy, click "Enable desktop notifications" once on `/dashboard/support` and approve the browser prompt.

## Out of Scope
- iOS Safari push (requires PWA install — defer)
- Service worker push (works only with tab open; full background push is a bigger lift)
- Throttling / digest emails (v1 sends one per message; can add a 5-min cooldown later if noisy)

## Technical Notes
- Reuses Lovable's email queue (retry-safe, rate-limit handling built in).
- DB trigger uses `pg_net` async POST so message insert latency is unaffected even if email function is slow.
- Browser Notification API works on desktop Chrome/Firefox/Safari and Android Chrome with the tab open or backgrounded.

