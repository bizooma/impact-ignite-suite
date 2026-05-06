# AccessNotify Module

A new plugin-style module inside the Causeio dashboard for ADA-aware Email/SMS/Voice notifications with accessibility review and compliance logging.

## Scope clarification

This is a **large** module. To keep it shippable, this plan delivers a fully-functional v1 with mock delivery (no real Twilio/Resend sending yet). All DB tables, RLS, UI sections, and service layer files are scaffolded so real provider integration is a drop-in later.

## 1. Routing & Navigation

- Add `accessnotify` to `ProductId` union in `src/hooks/useProductAccess.ts` and `ALL_PRODUCTS`.
- Add sidebar entry in `src/components/layout/AppSidebar.tsx` under Platform: **AccessNotify** (`/dashboard/accessnotify`, `Bell` icon, productId `accessnotify`).
- Register routes in `src/App.tsx` wrapped in `ProtectedProductRoute`:
  - `/dashboard/accessnotify` → Dashboard tab
  - `/dashboard/accessnotify/campaigns` → Campaigns list + builder
  - `/dashboard/accessnotify/campaigns/:id` → Campaign detail/edit
  - `/dashboard/accessnotify/templates`
  - `/dashboard/accessnotify/contacts` (preference center — links to existing CRM contacts but adds an `accessnotify_preferences` row)
  - `/dashboard/accessnotify/compliance` (logs)
  - `/dashboard/accessnotify/accommodations`
  - `/dashboard/accessnotify/settings`
- One root component `AccessNotifyDashboard` with internal tabs (matching the pattern of CRM/Mobile dashboards).

## 2. Database (migration)

New tables, all with `organization_id uuid not null`, RLS via `is_org_member` for select and `has_org_role(... 'admin'/'editor'/'owner')` for write:

- `accessnotify_campaigns` — name, type (enum: event_reminder, donation_reminder, volunteer_shift, program_update, membership_renewal, library_overdue, library_hold, emergency_alert), status (draft/scheduled/sending/sent/failed), audience_list_id (FK crm_lists nullable), channels text[] (email,sms,voice), subject, email_body, sms_body, voice_script, plain_language_body, cta_url, internal_notes, send_at, reminder_offset_minutes, accessibility_acknowledged bool, created_by, timestamps.
- `accessnotify_templates` — category, name, subject, email_body, sms_body, voice_script, plain_language_body, is_starter bool.
- `accessnotify_messages` — campaign_id, contact_id (nullable, FK crm_contacts), recipient_email, recipient_phone, channel, body_version (full/plain/sms/voice), created_at.
- `accessnotify_deliveries` — message_id, channel, status (pending/sent/delivered/failed/skipped), provider_id, error, attempted_at, delivered_at.
- `accessnotify_preferences` — contact_id (unique FK crm_contacts), preferred_method (email/sms/voice/multiple), large_text bool, simplified_language bool, voice_first bool, preferred_language text default 'en', do_not_call bool, do_not_text bool, accommodation_notes text.
- `accessnotify_accessibility_checks` — campaign_id, check_key, status (pass/warning/needs_review), detail, checked_at.
- `accessnotify_compliance_logs` — campaign_id, message_id, recipient_label, channel, delivery_status, accessibility_score int, template_id, sent_by, accommodation_applied jsonb, version_sent text, sent_at.
- `accessnotify_accommodation_requests` — contact_name, contact_id nullable, request_type, preferred_accommodation, notes, status (new/in_review/resolved), assigned_to (FK profiles), received_at, resolved_at.
- `accessnotify_settings` — one row per org (PK organization_id), default_from_email, default_sms_number, default_voice_caller_id, accessibility_statement_url, accommodation_contact_email, default_language, require_approval bool, channels_enabled jsonb.

Seed `accessnotify_templates` with the 4 starter templates from the spec (library overdue, donation reminder, volunteer shift, event reminder) as `is_starter=true, organization_id=null` (global) — RLS allows select where `organization_id is null OR is_org_member(...)`.

## 3. UI Components

`src/components/accessnotify/`
- `AccessNotifyDashboard.tsx` — Tabs container.
- `OverviewTab.tsx` — 6 stat cards (Total sent, Delivery rate, Accessibility pass rate, Failed, Accommodations applied, Open accommodation requests), recent activity table, compliance status pill. Uses real query counts; falls back to spec sample numbers when empty.
- `CampaignsTab.tsx` + `CampaignBuilderDialog.tsx` — list + multi-step form (Details → Audience → Channels & Content → Accessibility Review → Schedule/Send).
- `AccessibilityReviewPanel.tsx` — runs the 9 checklist items via `accessibilityReviewService` (heuristic checks on body text), renders Pass/Warning/Needs Review badges, "Improve with AI" button (calls existing Lovable AI gateway edge function pattern; placeholder edge function `accessnotify-ai-rewrite`).
- `TemplatesTab.tsx` — grid by category, "Use template" copies into builder.
- `ContactPreferencesTab.tsx` — table of CRM contacts with inline edit dialog for preferences.
- `ComplianceLogsTab.tsx` — filterable table (date range, channel, type, delivery status, accessibility status) + CSV export button.
- `AccommodationRequestsTab.tsx` — kanban-style 3 columns (New / In Review / Resolved) + create dialog.
- `SettingsTab.tsx` — form bound to `accessnotify_settings`.

Style: reuse existing `Card`, `Table`, `Badge`, `Tabs`, `Dialog`, `Input`, `Textarea`, `Select` components. Match CRM dashboard layout density.

## 4. Hooks

`src/hooks/` — `useAccessNotifyCampaigns`, `useAccessNotifyTemplates`, `useAccessNotifyPreferences`, `useAccessNotifyComplianceLogs`, `useAccessNotifyAccommodations`, `useAccessNotifySettings`. All React Query, scoped by `organizationId`.

## 5. Service layer (mock-ready)

`src/lib/accessnotify/`
- `emailNotificationService.ts` — `send({to, subject, html})` returns mock `{status:'sent', providerId}`. TODO comment for Resend.
- `smsNotificationService.ts` — Twilio placeholder.
- `voiceNotificationService.ts` — Twilio Voice placeholder.
- `accessibilityReviewService.ts` — pure functions: `runChecks(campaign)` returns array of `{key, label, status, detail}`. Heuristics: detect "click here", missing alt brackets in markdown images, ALL CAPS ratio, sentence length, color words without alternatives, etc.
- `complianceLogService.ts` — `logSend(...)` inserts into `accessnotify_compliance_logs`.
- `contactPreferenceService.ts` — `resolveChannels(contact, requestedChannels)` applies do-not-call / voice-first / simplified-language rules; returns `{channels, bodyVersion}`.

A `dispatchCampaign(campaignId)` orchestrator iterates the audience list, calls `contactPreferenceService.resolveChannels`, then the channel services, then `complianceLogService.logSend`. Runs entirely client-side for v1 against mock services (no real sending).

## 6. Edge function (single, optional)

`supabase/functions/accessnotify-ai-rewrite/index.ts` — accepts `{text, mode: 'plain'|'accessible'}`, calls Lovable AI gateway (`LOVABLE_API_KEY` already set), returns rewritten text. Used by "Improve with AI" button.

## 7. Permissions

Reuse existing `app_role`. RLS:
- read: `is_org_member`
- create/update campaigns/templates/settings: owner/admin/editor (manager-equivalent)
- delete: owner/admin
- accommodation requests: any member can create; only assigned/admin can resolve
- viewer role gets read-only via existing membership without write policies

## 8. Sample data

On first visit to AccessNotify with empty data, the OverviewTab displays the spec's sample metrics (1,248 sent, 96.4%, 92%, 17, 8, 3) with a "Sample data" badge — no DB writes. Real data takes over once the org sends its first campaign.

## Technical notes

- All tables use `gen_random_uuid()` PKs, `created_at`/`updated_at timestamptz default now()`, and triggers using existing `update_updated_at_column()`.
- A starter-template seed runs in the same migration via `INSERT ... ON CONFLICT DO NOTHING`.
- No new secrets needed for v1 (services are mocked). When the user later wants real sending, we'll add Resend (already connected) + Twilio connector and wire the service files.
- Bundle: AccessNotify is added to `merge_tier_products` `enterprise` bundle; for now, platform admins and any org with `accessnotify` in `purchased_products` can access it. We can grant it manually to the beta org via `OrgProductAccessManager`.

## Out of scope for v1

- Real Twilio/Resend sending (services are mocked but structured for drop-in).
- PDF export of compliance logs (CSV only; PDF can be added later).
- Recurring campaigns (single send_at only).
- Webhook receivers for delivery status callbacks.
