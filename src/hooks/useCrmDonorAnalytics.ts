import { useMemo } from 'react';
import { useCrmDonations, type CrmDonation } from './useCrmDonations';
import { useCrm, type CrmContact } from './useCrm';

export type DonorSegmentKey =
  | 'major'
  | 'sustaining'
  | 'lybunt'
  | 'sybunt'
  | 'new_this_year'
  | 'lapsed';

export interface DonorSegment {
  key: DonorSegmentKey;
  label: string;
  description: string;
  contactIds: string[];
  totalValue?: number;
}

export interface DonorAnalytics {
  segments: Record<DonorSegmentKey, DonorSegment>;
  retentionRate: number;
  retentionDetails: { lastYearDonors: number; retainedDonors: number };
  isLoading: boolean;
  contactById: Map<string, CrmContact>;
}

const MAJOR_GIFT_THRESHOLD = 1000;

export function useCrmDonorAnalytics(organizationId: string): DonorAnalytics {
  const { donations, isLoading: dLoading } = useCrmDonations(organizationId);
  const { contacts, contactsLoading } = useCrm(organizationId);

  return useMemo(() => {
    const contactById = new Map<string, CrmContact>();
    contacts?.forEach((c) => contactById.set(c.id, c));

    const empty = (key: DonorSegmentKey, label: string, description: string): DonorSegment => ({
      key, label, description, contactIds: [], totalValue: 0,
    });

    const segments: Record<DonorSegmentKey, DonorSegment> = {
      major: empty('major', 'Major Donors', `Lifetime giving ≥ $${MAJOR_GIFT_THRESHOLD.toLocaleString()}`),
      sustaining: empty('sustaining', 'Sustaining Donors', 'Active recurring givers'),
      lybunt: empty('lybunt', 'LYBUNT', 'Gave Last Year But Unfortunately Not This year'),
      sybunt: empty('sybunt', 'SYBUNT', 'Some Year But Unfortunately Not This year'),
      new_this_year: empty('new_this_year', 'New Donors (YTD)', 'First-ever gift this calendar year'),
      lapsed: empty('lapsed', 'Lapsed', 'No gift in the last 24 months'),
    };

    if (!donations || donations.length === 0) {
      return {
        segments,
        retentionRate: 0,
        retentionDetails: { lastYearDonors: 0, retainedDonors: 0 },
        isLoading: dLoading || contactsLoading,
        contactById,
      };
    }

    const now = new Date();
    const thisYear = now.getFullYear();
    const lastYear = thisYear - 1;
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

    // Group donations by contact
    const byContact = new Map<string, CrmDonation[]>();
    donations.forEach((d) => {
      const arr = byContact.get(d.contact_id) || [];
      arr.push(d);
      byContact.set(d.contact_id, arr);
    });

    const lastYearDonorIds = new Set<string>();
    const thisYearDonorIds = new Set<string>();

    byContact.forEach((gifts, contactId) => {
      const lifetime = gifts.reduce((s, g) => s + Number(g.amount), 0);
      const dates = gifts.map((g) => new Date(g.donation_date));
      const years = new Set(dates.map((d) => d.getFullYear()));
      const firstGiftYear = Math.min(...dates.map((d) => d.getFullYear()));
      const lastGiftDate = new Date(Math.max(...dates.map((d) => d.getTime())));
      const hasRecurring = gifts.some((g) => g.is_recurring);

      if (years.has(lastYear)) lastYearDonorIds.add(contactId);
      if (years.has(thisYear)) thisYearDonorIds.add(contactId);

      // Major
      if (lifetime >= MAJOR_GIFT_THRESHOLD) {
        segments.major.contactIds.push(contactId);
        segments.major.totalValue! += lifetime;
      }
      // Sustaining
      if (hasRecurring) segments.sustaining.contactIds.push(contactId);
      // LYBUNT — gave last year, not this year
      if (years.has(lastYear) && !years.has(thisYear)) {
        segments.lybunt.contactIds.push(contactId);
      }
      // SYBUNT — gave any prior year (not last year alone), not this year
      if (!years.has(thisYear) && firstGiftYear < thisYear && !years.has(lastYear)) {
        segments.sybunt.contactIds.push(contactId);
      }
      // New this year — first-ever gift is this year
      if (firstGiftYear === thisYear) segments.new_this_year.contactIds.push(contactId);
      // Lapsed — last gift more than 24 months ago
      if (lastGiftDate < twoYearsAgo) segments.lapsed.contactIds.push(contactId);
    });

    let retainedDonors = 0;
    lastYearDonorIds.forEach((id) => {
      if (thisYearDonorIds.has(id)) retainedDonors += 1;
    });
    const retentionRate = lastYearDonorIds.size === 0 ? 0 : (retainedDonors / lastYearDonorIds.size) * 100;

    return {
      segments,
      retentionRate,
      retentionDetails: { lastYearDonors: lastYearDonorIds.size, retainedDonors },
      isLoading: dLoading || contactsLoading,
      contactById,
    };
  }, [donations, contacts, dLoading, contactsLoading]);
}

export { MAJOR_GIFT_THRESHOLD };
