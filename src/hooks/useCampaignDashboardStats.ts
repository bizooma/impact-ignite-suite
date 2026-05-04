import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CampaignDashboardStats {
  campaignId: string;
  briefStatus: 'complete' | 'draft' | 'missing';
  milestonesTotal: number;
  milestonesDone: number;
  assetsTotal: number;
  assetsPublished: number;
  donationsAmount: number;
  nextMilestoneTitle: string | null;
  nextMilestoneDue: string | null;
}

/**
 * Aggregate progress for every campaign in an org.
 * Used by the campaign dashboard cards to show real numbers (no placeholders).
 */
export function useCampaignDashboardStats(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['campaign-dashboard-stats', organizationId],
    queryFn: async (): Promise<Record<string, CampaignDashboardStats>> => {
      if (!organizationId) return {};

      // Single round-trip per table — keep it cheap.
      const [briefsRes, milestonesRes, assetsRes, donationsRes, campaignsRes] = await Promise.all([
        supabase.from('campaign_briefs').select('campaign_id, status').eq('organization_id', organizationId),
        supabase
          .from('campaign_milestones')
          .select('campaign_id, status, due_date, title, marketing_campaigns!inner(organization_id)')
          .eq('marketing_campaigns.organization_id', organizationId),
        supabase
          .from('campaign_assets')
          .select('campaign_id, status, marketing_campaigns!inner(organization_id)')
          .eq('marketing_campaigns.organization_id', organizationId),
        supabase
          .from('crm_donations')
          .select('marketing_campaign_id, amount')
          .eq('organization_id', organizationId)
          .not('marketing_campaign_id', 'is', null),
        supabase.from('marketing_campaigns').select('id').eq('organization_id', organizationId),
      ]);

      const result: Record<string, CampaignDashboardStats> = {};

      const seed = (id: string) => {
        if (!result[id]) {
          result[id] = {
            campaignId: id,
            briefStatus: 'missing',
            milestonesTotal: 0,
            milestonesDone: 0,
            assetsTotal: 0,
            assetsPublished: 0,
            donationsAmount: 0,
            nextMilestoneTitle: null,
            nextMilestoneDue: null,
          };
        }
        return result[id];
      };

      (campaignsRes.data || []).forEach((c: any) => seed(c.id));

      (briefsRes.data || []).forEach((b: any) => {
        seed(b.campaign_id).briefStatus = (b.status as 'complete' | 'draft') || 'draft';
      });

      const today = new Date().toISOString().slice(0, 10);
      (milestonesRes.data || []).forEach((m: any) => {
        const s = seed(m.campaign_id);
        s.milestonesTotal += 1;
        if (m.status === 'completed') s.milestonesDone += 1;
        else if (m.due_date && m.due_date >= today) {
          if (!s.nextMilestoneDue || m.due_date < s.nextMilestoneDue) {
            s.nextMilestoneDue = m.due_date;
            s.nextMilestoneTitle = m.title;
          }
        }
      });

      (assetsRes.data || []).forEach((a: any) => {
        const s = seed(a.campaign_id);
        s.assetsTotal += 1;
        if (a.status === 'published' || a.status === 'scheduled') s.assetsPublished += 1;
      });

      (donationsRes.data || []).forEach((d: any) => {
        const s = seed(d.marketing_campaign_id);
        s.donationsAmount += Number(d.amount || 0);
      });

      return result;
    },
    enabled: !!organizationId,
  });
}
