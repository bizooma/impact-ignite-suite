
## Campaigns — Comprehensive Marketing Plan Builder

A new top-level product that orchestrates a full multi-channel marketing campaign by tying together the platform's existing apps (Social Media, CRM, Chatbot, QR Codes, GBP, Tasks, SEO). First template ships preloaded for **Giving Tuesday**.

### Core concept
A Campaign isn't a checklist — it's a **timeline-driven plan** with a goal, audience, channels, content calendar, and live performance tracking. Each Campaign generates real artifacts in the other apps (scheduled social posts, CRM segments, tasks, QR codes) that stay linked back so the user sees one unified view.

### Schema (new tables)

```text
marketing_campaigns
  id, organization_id, name, slug, template_key (e.g. 'giving_tuesday')
  goal_amount, goal_donors, goal_currency
  start_date, end_date, event_date  (the big day)
  theme_color, hero_image_url, tagline, story
  audience_segments jsonb  (refs to crm_lists + segment keys)
  channels jsonb  (which apps are active: social, email, sms, chatbot, qr, gbp)
  status (draft|active|completed|archived)
  created_by, created_at, updated_at

campaign_milestones      -- the timeline (auto-seeded from template)
  id, campaign_id, phase (awareness|engagement|push|day_of|stewardship)
  title, description, due_date, status, owner_id, order_index

campaign_assets          -- linked artifacts in other apps
  id, campaign_id, asset_type (social_post|email_draft|task|qr_code|chatbot_faq|landing_section)
  asset_id (uuid in source table), title, scheduled_for, status, metadata

campaign_metrics_snapshots  -- daily roll-up for the dashboard
  id, campaign_id, snapshot_date,
  donations_count, donations_amount, new_donors,
  social_reach, social_engagement, qr_scans, chat_sessions, emails_drafted
```

Plus a `campaign_id` column added to `crm_donations` (already exists), `social_posts`, `qr_codes`, `crm_interactions` so we can attribute results.

### The Giving Tuesday template (preloaded)
When the user clicks "Use Giving Tuesday template," we auto-create:

1. **Auto-dated timeline** based on the calculated GT date (Tuesday after US Thanksgiving). 5 phases:
   - **Awareness** (8 weeks out): announce, build email list, soft-launch story
   - **Engagement** (4 weeks out): teaser social posts, donor stories, sneak-peek matching gifts
   - **Final Push** (1 week out): countdown posts, peer-to-peer asks, email sequence
   - **Day Of**: hourly social posts, live thermometer, GBP post, push to chatbot
   - **Stewardship** (week after): thank-you emails, impact report draft, recurring-gift ask

2. **Pre-written content library** the user edits and then 1-clicks to schedule:
   - 12 social posts (Facebook/Instagram/LinkedIn copy + image prompts)
   - 5 email drafts (announce, story, matching, day-of, thank-you) — generates copy-paste drafts via the same mailto pattern as acknowledgments
   - 3 SMS scripts
   - 8 chatbot FAQ entries (auto-injected into selected chatbot)
   - 1 GBP post

3. **Suggested audience segments** auto-built from CRM:
   - LYBUNT (lapsed last year)
   - Sustaining donors → upgrade ask
   - New donors this year → first GT ask
   - Major donors → matching-gift challenge

4. **Auto-generated tasks** assigned to the owner (via existing `tasks` table, tagged with `campaign_id`):
   - "Recruit 3 matching gift sponsors" (8 weeks out)
   - "Design hero graphic" (6 weeks out)
   - "Brief board on peer-to-peer asks" (4 weeks out)
   - "Test donation page on mobile" (1 week out)

5. **Trackable QR code** auto-generated pointing to the campaign donation URL — gets placed on print materials, tracked in dashboard.

6. **Donation goal thermometer** — live widget showing `crm_donations` filtered by `campaign_id`, with progress bar toward `goal_amount`.

### UI structure

**`/dashboard/campaigns`** — list view
- Cards per campaign: status, dates, % to goal, days remaining
- "New Campaign" → template picker (Giving Tuesday, Year-End, Custom Blank)

**`/dashboard/campaigns/:id`** — campaign workspace with 6 tabs:
1. **Overview** — hero card (goal thermometer, countdown, key metrics), phase progress, next 5 milestones
2. **Timeline** — vertical phase timeline, drag tasks between phases
3. **Content** — tabs for Social / Email / SMS / Chatbot / GBP. Each shows pre-written drafts → "Schedule" or "Copy" buttons that hit the existing apps
4. **Audience** — selected CRM segments with live counts; "Add Segment" pulls from `useCrmDonorAnalytics`
5. **Tasks** — filtered task list (the existing TaskDashboard scoped by `campaign_id`)
6. **Analytics** — donations attributed, social engagement, QR scans, chatbot conversions, day-by-day chart

### Cross-app integration
- **Social Media**: when user clicks "Schedule" on a draft post → creates row in `social_posts` with `campaign_id` set; appears in Social Calendar
- **CRM**: donation attribution via `crm_donations.campaign_id`; segment counts pulled live
- **Chatbot**: campaign FAQs injected into selected chatbot via `chatbot_faqs`
- **QR Codes**: campaign QR auto-created in `qr_codes`, scans counted
- **Tasks**: campaign tasks live in `tasks` table with `campaign_id` filter
- **GBP**: GBP post drafted as a copy-paste asset

### Files to create
- Migration: 4 new tables + `campaign_id` columns where missing + `campaign_template` enum
- Hooks: `useCampaigns.ts`, `useCampaign.ts`, `useCampaignAssets.ts`, `useCampaignMetrics.ts`
- Pages: `src/pages/Campaigns.tsx` (list), `src/pages/CampaignDetail.tsx`
- Components (`src/components/campaigns/`):
  - `CampaignDashboard.tsx`, `CampaignTemplatePicker.tsx`, `CampaignFormDialog.tsx`
  - `CampaignOverview.tsx` (thermometer, countdown, phase pills)
  - `CampaignTimeline.tsx`, `CampaignContentLibrary.tsx`
  - `CampaignAudienceSelector.tsx`, `CampaignAnalytics.tsx`
  - `GoalThermometer.tsx`, `CountdownClock.tsx`
- Template data: `src/lib/campaignTemplates/givingTuesday.ts` (all the pre-written copy, milestones, tasks, FAQs)
- Sidebar: add "Campaigns" entry in `AppSidebar.tsx`
- Routes: register in `App.tsx` under `/dashboard/campaigns`

### Files to edit
- `AppSidebar.tsx`, `App.tsx`, `useProductAccess.ts` (add `campaigns` product)
- Existing `CampaignManager.tsx` (in social) — repoint or deprecate; the new system supersedes it

### Why this is more than a checklist
- Real artifacts created in other apps — not just reminders
- Live donation thermometer pulling actual `crm_donations`
- Auto-segmented audiences using existing donor analytics
- Date-aware timeline that recalculates if user changes start/event date
- Multi-channel content library with one-click scheduling
- Unified analytics tying donations, engagement, scans, and chats back to the campaign
