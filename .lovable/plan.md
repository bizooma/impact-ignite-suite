## Goal
Surface relevant national/international awareness days (e.g., Giving Tuesday, Earth Day, Mental Health Awareness Month) directly on the **Social Media Calendar** so org admins get post/campaign ideas at a glance, and let them toggle the overlay on/off (and filter by category).

## Reuse what already exists
We already have a curated dataset in `src/lib/campaignTemplates/awarenessCalendar.ts` (≈40 events tagged by category: health, social, environment, youth, arts, animals, giving, global) — already used by the **Campaign Inspiration grid**. We'll reuse it as the single source of truth so campaigns and the calendar stay consistent.

## UX

### On `SocialCalendar.tsx`
1. **Awareness chips inside each day cell** (above the scheduled-post list):
   - Small colored pill using `event.color` showing the event name (truncated, with tooltip for full name).
   - Click a chip → opens a lightweight popover: name, description, category, "Create campaign" button (navigates to `/dashboard/campaigns?template=<key>` — same flow as Inspiration grid) and "Schedule a post for this day" button (opens `PostComposer` pre-filled with the date).
   - For **month-scope events** (e.g., "Mental Health Awareness Month"): show a subtle banner across the top of the calendar grid for that month instead of repeating the chip 30 times.

2. **New toolbar row above the calendar** (next to month nav):
   - **Toggle switch**: "Show awareness days" (default ON).
   - **Category multi-select** (dropdown of checkboxes): health, social, environment, youth, giving, global, etc. Default: all selected.
   - Both persist per-org (see below).

### Visual treatment
- Awareness chips use a distinct dotted/dashed left border + the event's accent color so they're clearly differentiated from scheduled posts.
- Month-long observance banner is a thin colored strip at top of the calendar card with up to 3 month events listed inline ("April: Earth Month · Volunteer Month · Autism Acceptance Month").

## Persistence (per-org settings)

Add a tiny new table to remember each org's preferences:

```sql
create table public.social_calendar_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique,
  show_awareness_days boolean not null default true,
  enabled_categories text[] not null default array['health','social','environment','youth','arts','animals','giving','global'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.social_calendar_settings enable row level security;

create policy "Org members can view settings"
  on public.social_calendar_settings for select
  using (is_org_member(auth.uid(), organization_id));

create policy "Org admins can manage settings"
  on public.social_calendar_settings for all
  using (has_org_role(auth.uid(), organization_id, 'admin') or has_org_role(auth.uid(), organization_id, 'owner'))
  with check (has_org_role(auth.uid(), organization_id, 'admin') or has_org_role(auth.uid(), organization_id, 'owner'));
```

Members see whatever the admin set; admins can change it.

## Code changes

1. **New hook** `src/hooks/useSocialCalendarSettings.ts`
   - Fetches/upserts the row for the current org. Returns `{ showAwarenessDays, enabledCategories, toggle, setCategories }`.

2. **New helper** in `src/lib/calendarUtils.ts`
   - `getAwarenessEventsForMonth(month: Date, enabledCategories: string[])` → returns `{ dayEvents: Map<dateKey, AwarenessEvent[]>, monthEvents: AwarenessEvent[] }` by resolving each event for the visible year (handles `resolve()` for movable observances like Giving Tuesday/MLK Day).

3. **Update** `src/components/social/SocialCalendar.tsx`
   - Accept `organizationId` prop (passed from `SocialMediaDashboard`).
   - Wire up the settings hook + new toolbar (Switch + categories Popover).
   - Render month-scope banner and per-day awareness chips.
   - New small subcomponent `AwarenessChip` with click → Popover (Create campaign / Schedule post).

4. **Update** `src/components/social/SocialMediaDashboard.tsx`
   - Pass `organizationId` into `<SocialCalendar />` (currently only posts/filters are passed).

5. **No changes needed** to `awarenessCalendar.ts` — already complete and correct.

## Out of scope (can do later if you want)
- Letting orgs add **custom org-specific dates** (e.g., their gala, founding date). Easy follow-up: add a `social_calendar_custom_events` table with the same shape.
- Auto-generating draft posts for upcoming awareness days via AI.

## Files touched
- **New migration**: `social_calendar_settings` table + RLS
- **New**: `src/hooks/useSocialCalendarSettings.ts`
- **Modified**: `src/lib/calendarUtils.ts` (add helper)
- **Modified**: `src/components/social/SocialCalendar.tsx` (toolbar + chips + banner + popover)
- **Modified**: `src/components/social/SocialMediaDashboard.tsx` (pass `organizationId` to calendar)