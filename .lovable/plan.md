## Goal

Make Campaigns a real, working workflow: every campaign starts with a **Creative Brief**, the brief drives generated content and goals, and assets actually publish/attribute to other modules (Social, Tasks, CRM donations). Remove the "shell" feeling that comes from blank campaigns, non-template observances seeding nothing, and audience tiles that don't do anything.

## What's actually broken vs working today

Working (keep):
- `marketing_campaigns`, `campaign_milestones`, `campaign_assets`, `campaign_metrics` tables and hooks
- Giving Tuesday template seeds milestones, assets, tasks
- Donation metrics read live from `crm_donations.marketing_campaign_id`
- Audience tab counts come from real CRM analytics

Broken / hollow (fix):
1. **Blank campaigns** create "Untitled Campaign" with zero milestones, zero assets, zero tasks → nothing to do.
2. **Awareness-calendar campaigns** (anything except Giving Tuesday) also seed nothing — just a name + dates.
3. **No creative brief** anywhere. Campaign goals/tagline/story are guessed.
4. **Content Library** assets are draft-only — no button to push a social asset into Social Composer, no button to convert email draft into a real email send, no way to schedule.
5. **Audience tab** shows counts but no action — can't create a CRM list from a segment or attach it to the campaign.
6. **Donation attribution**: `crm_donations.marketing_campaign_id` exists, but the donation form doesn't expose a campaign picker, so metrics stay at $0 unless rows are edited in SQL.
7. **Social posts**: `social_posts.campaign_id` points to the legacy `campaigns` table, not `marketing_campaigns` — so even if pushed, they don't roll up.
8. No "mock data" tables anywhere; the hollow feeling comes from #1–#7, not from fixtures. Confirmed via repo search.

## Plan

### Phase 1 — Creative Brief is step 1 of every campaign

New table `campaign_briefs` (1:1 with `marketing_campaigns`):
- `objective` (enum: fundraise, awareness, recruit_volunteers, event_attendance, advocacy, stewardship)
- `primary_goal_amount`, `primary_goal_donors`, `goal_currency`
- `audience_description` (text), `audience_segments` (jsonb of segment keys)
- `key_message`, `tone` (enum: warm, urgent, celebratory, professional, playful)
- `call_to_action`, `landing_url`
- `channels` (jsonb: social/email/sms/chatbot/qr/gbp toggles)
- `start_date`, `end_date`, `event_date`
- `theme_color`, `hero_image_url`
- `status` (draft/complete), `completed_at`
- RLS: org members read/write their own org's briefs

Replace the current `CampaignTemplatePicker` "Blank vs Giving Tuesday" dialog with a **3-step Brief Wizard** (`CampaignBriefWizard.tsx`) that:
1. **Pick a starting point** — Blank, Giving Tuesday, or any awareness-calendar event (existing inspiration grid promoted into step 1). Selection prefills brief defaults.
2. **Brief form** — collects all fields above. Required: objective, audience, key message, CTA, dates.
3. **Review & Generate** — summary + "Create campaign" button.

On submit:
- Create `marketing_campaigns` row with brief-derived fields (goals, dates, theme, tagline = key_message)
- Create matching `campaign_briefs` row
- Seed milestones/assets/tasks based on objective + selected template (see Phase 2)

The campaign detail page gets a new first tab **"Brief"** that shows the brief read-only with an Edit button. Cannot leave brief incomplete — campaigns without a complete brief are flagged "Brief incomplete" on the dashboard card.

### Phase 2 — Universal seeding (every campaign gets real content)

Extract a generic seeder `seedCampaignFromBrief(campaign, brief)` in `src/lib/campaignTemplates/genericSeeder.ts`:
- Milestones: standard 5-phase plan (awareness → engagement → push → day_of → stewardship), dates derived from `event_date` and `start_date`. Phases adapt to objective (e.g., advocacy skips "stewardship donor thank-you").
- Assets: generate 1 social post per phase per enabled channel, 2 email drafts, 1 SMS, 3 chatbot FAQs, 1 GBP post — using brief's `key_message`, `tone`, `call_to_action`. Implemented as templated strings (no AI call required for v1; AI enhancement is a later add).
- Tasks: 6–10 standard tasks (design hero image, brief board, schedule social, draft thank-you email, etc.), inserted into `tasks` with `marketing_campaign_id`.

Giving Tuesday keeps its richer pre-written content via the existing `givingTuesday.ts` seeder; everything else uses the generic seeder. Awareness-calendar items pass `event.name`/`description` into the brief defaults.

### Phase 3 — Make assets actually do something

In `CampaignContentLibrary`, add per-asset action buttons:
- **Social asset → "Send to Composer"**: navigates to `/dashboard/social/compose?asset=<id>` which prefills `PostComposer` with body, media, and a hidden `marketing_campaign_id`.
- **Email asset → "Open in Email"**: stub route for now (`/dashboard/social?tab=email&asset=<id>`) — flagged as "coming when Email module ships" if not present.
- **GBP asset → "Send to Google Business"**: prefill GBP post composer.
- **Chatbot FAQ → "Add to Chatbot"**: opens `FaqDialog` prefilled.
- **SMS → "Copy" only** for now.

When an asset is pushed, mark `campaign_assets.status = 'published'` and store the resulting `social_posts.id` (or equivalent) in `campaign_assets.asset_id` so the Library shows live status.

### Phase 4 — Wire social posts to marketing_campaigns

- Migration: add `social_posts.marketing_campaign_id uuid` (nullable, FK to `marketing_campaigns`, on delete set null). Keep legacy `campaign_id` for backward compat but stop using it for new campaigns.
- `PostComposer` gains a "Marketing campaign" picker (lists active marketing_campaigns). When set, all rolled-up engagement metrics for the campaign include those posts.
- Add a small `social_posts` count + reach card to `CampaignAnalytics`.

### Phase 5 — Donation attribution from the CRM

- `DonationFormDialog` gets a "Campaign" select (active marketing_campaigns). Writes to `crm_donations.marketing_campaign_id`.
- Donations table shows campaign badge column.
- `CampaignAnalytics` already reads from this — once form supports it, the $0 metrics start populating naturally.

### Phase 6 — Audience tab becomes actionable

For each suggested-audience tile (LYBUNT, Sustaining, New, Major):
- "Create CRM list" → calls existing `crm_lists` insert + `crm_list_memberships` for the contact IDs from `useCrmDonorAnalytics`. Stores list id in `campaign_briefs.audience_segments`.
- "View contacts" → opens `ListMembersDialog` filtered to that segment.
- Tiles show "Attached to campaign" once linked.

### Phase 7 — Dashboard card polish

Campaign card on `/dashboard/campaigns` shows:
- Brief status pill (Complete / Incomplete)
- Real progress: `% milestones complete`, `$ raised / goal`, `# assets published / total`
- Next milestone due
- Greys out the campaign if brief incomplete; clicking opens Brief Wizard at step 2.

## Technical notes

Migrations:
- `campaign_briefs` table + RLS (org-scoped via existing `has_org_role` helper pattern).
- `social_posts.marketing_campaign_id` column + index.
- Trigger to set `campaign_briefs.completed_at` when status flips to `complete`.

New files:
- `src/components/campaigns/CampaignBriefWizard.tsx`
- `src/components/campaigns/BriefForm.tsx`
- `src/components/campaigns/BriefSummaryTab.tsx`
- `src/lib/campaignTemplates/genericSeeder.ts`
- `src/hooks/useCampaignBrief.ts`

Modified:
- `CampaignDashboard` — new card visuals + "New Campaign" opens wizard
- `CampaignDetail` — adds "Brief" tab as default
- `CampaignContentLibrary` — per-asset push actions
- `CampaignAudienceSelector` — list creation + attachment
- `PostComposer`, `DonationFormDialog` — campaign pickers
- `CampaignTemplatePicker` — replaced/removed (folded into wizard)

Deferred to later phases (not in this build):
- AI-generated brief copy (templated strings for v1)
- Email/SMS sending modules if not already present
- A/B testing on assets

## Acceptance

- "New Campaign" forces brief completion before a campaign exists in the list.
- A blank campaign created via wizard ends up with milestones, ≥10 assets, and ≥6 tasks.
- Pushing a social asset creates a real `social_posts` row tagged with `marketing_campaign_id` and updates Library status.
- Logging a donation tagged to a campaign moves the goal thermometer.
- Creating a CRM list from an audience tile produces a real list visible in CRM → Lists.
- No campaign in the dashboard shows $0/empty unless the brief is incomplete or no activity has happened yet (with clear copy explaining why).
