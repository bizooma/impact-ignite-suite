import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CampaignMetrics {
  donations_count: number;
  donations_amount: number;
  unique_donors: number;
  goal_amount: number | null;
  goal_donors: number | null;
  percent_to_goal: number;
  recent_donations: Array<{ amount: number; donation_date: string; contact_id: string }>;
}

export function useCampaignMetrics(campaignId: string, organizationId: string) {
  return useQuery({
    queryKey: ['campaign-metrics', campaignId],
    queryFn: async (): Promise<CampaignMetrics> => {
      const [{ data: campaign }, { data: donations }] = await Promise.all([
        supabase.from('marketing_campaigns').select('goal_amount, goal_donors').eq('id', campaignId).single(),
        supabase
          .from('crm_donations')
          .select('amount, donation_date, contact_id')
          .eq('organization_id', organizationId)
          .eq('marketing_campaign_id', campaignId)
          .order('donation_date', { ascending: false }),
      ]);

      const list = (donations || []) as Array<{ amount: number; donation_date: string; contact_id: string }>;
      const total = list.reduce((s, d) => s + Number(d.amount || 0), 0);
      const uniqueDonors = new Set(list.map((d) => d.contact_id)).size;
      const goal = campaign?.goal_amount || null;

      return {
        donations_count: list.length,
        donations_amount: total,
        unique_donors: uniqueDonors,
        goal_amount: goal,
        goal_donors: campaign?.goal_donors || null,
        percent_to_goal: goal ? Math.min(100, (total / goal) * 100) : 0,
        recent_donations: list.slice(0, 10),
      };
    },
    enabled: !!campaignId && !!organizationId,
  });
}
