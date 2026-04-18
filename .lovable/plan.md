

## CRM Audit — Findings

### 🔴 Mock data / placeholders found
1. **CrmDashboard "Engagement 78%"** stat card — hardcoded fake number with "Response rate" label.
2. **CrmDashboard Donations tab** — "Donation tracking coming soon..." placeholder. (`crm_donations` table exists, empty.)
3. **CrmDashboard Volunteer Hours tab** — "Volunteer hour tracking coming soon..." placeholder. (`crm_volunteer_hours` table exists, empty.)
4. **ContactProfile Interactions tab** — "Interaction history coming soon..." placeholder. (`crm_interactions` table exists, has data; `getContactInteractions` already implemented but unused.)
5. **ContactProfile Donations tab** — "Donation history coming soon..." placeholder.
6. **ContactProfile Notes tab** — "Notes coming soon..." placeholder. (`crm_notes` table exists.)

### 🟡 Broken / non-functional UI
7. **ContactsTable dropdown menu**: "Edit", "Add to List", "Delete" items have **no onClick handlers** — purely decorative.
8. **ListsManager "Create List" button** — no onClick, opens nothing.
9. **ContactProfile** — no Edit / Delete buttons at all (read-only).

### 🟢 Already working (verified)
- Contacts CRUD hook (`useCrm`), list fetching, list members dialog, Mailchimp sync (real edge functions), ContactForm create.

---

## Plan — Build everything for real

### 1. Replace fake "Engagement" stat
Replace with a real metric: **Active this month** (contacts with `last_interaction_at` in current month).

### 2. Wire up Contact row actions
- **Edit** → open `ContactForm` in edit mode (extend it to accept an existing contact).
- **Delete** → confirm dialog → `deleteContact` mutation.
- **Add to List** → submenu of available lists → `addContactToList`.

### 3. Wire up "Create List" button
New `ListFormDialog` (name, description, color, type=static). Use existing `createList` mutation.

### 4. ContactProfile — make all tabs functional + add Edit/Delete header buttons
- **Overview**: add address display, opt-in toggles that persist via `updateContact`.
- **Interactions tab**: real list from `crm_interactions` (use existing `getContactInteractions`) + "Log interaction" button (type, subject, description) using existing `logInteraction`.
- **Donations tab**: list from `crm_donations` filtered by `contact_id` + "Record donation" form (amount, date, campaign, payment_method, notes) writing to `crm_donations`.
- **Notes tab**: list from `crm_notes` (newest first, pinned first) + textarea to add note → insert with `author_id = auth.uid()`.

### 5. CrmDashboard — Donations tab
Real component `DonationsManager`:
- Aggregates: total raised this year, donor count, recurring count, avg gift.
- Table of all donations (contact name, amount, date, campaign, method) with date filters.
- "Record Donation" button opens form (with contact picker).

### 6. CrmDashboard — Volunteer Hours tab
Real component `VolunteerHoursManager`:
- Aggregates: total hours this month/year, top volunteers, pending approval count.
- Table (contact, activity, hours, date, status) with approve/reject actions for admins.
- "Log Hours" button opens form (contact picker, activity, hours, date, location, supervisor, notes).

### 7. New hooks
- `useCrmDonations(orgId)` — fetch + create + update.
- `useCrmVolunteerHours(orgId)` — fetch + create + approve.
- `useCrmNotes(contactId, orgId)` — fetch + create + delete + pin.
- Extend `useCrm` to expose `getContactDonations(contactId)` and `getContactNotes(contactId)`.

### 8. Database
No schema changes needed — all tables (`crm_donations`, `crm_volunteer_hours`, `crm_notes`, `crm_interactions`) already exist with proper RLS.

### Files to edit
- `src/components/crm/CrmDashboard.tsx`
- `src/components/crm/ContactsTable.tsx`
- `src/components/crm/ContactProfile.tsx`
- `src/components/crm/ContactForm.tsx` (add edit mode)
- `src/components/crm/ListsManager.tsx`
- `src/hooks/useCrm.ts`

### Files to create
- `src/components/crm/ListFormDialog.tsx`
- `src/components/crm/DonationsManager.tsx`
- `src/components/crm/DonationFormDialog.tsx`
- `src/components/crm/VolunteerHoursManager.tsx`
- `src/components/crm/VolunteerHoursFormDialog.tsx`
- `src/components/crm/InteractionLogDialog.tsx`
- `src/components/crm/AddToListDialog.tsx`
- `src/components/crm/DeleteContactDialog.tsx`
- `src/hooks/useCrmDonations.ts`
- `src/hooks/useCrmVolunteerHours.ts`
- `src/hooks/useCrmNotes.ts`

### Outcome
Every tab, button, and menu item in the CRM will hit real Supabase data. No placeholders, no fake numbers, no dead clicks.

