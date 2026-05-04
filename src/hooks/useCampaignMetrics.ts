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
  social_posts_total: number;
  social_posts_published: number;
  social_reach: number;
  social_engagement: number;
  social_by_platform: Array<{ platform: string; count: number }>;
}

export function useCampaignMetrics(campaignId: string, organizationId: string) {
  return useQuery({
    queryKey: ['campaign-metrics', campaignId],
    queryFn: async (): Promise<CampaignMetrics> => {
      const [{ data: campaign }, { data: donations }, { data: posts }] = await Promise.all([
        supabase.from('marketing_campaigns').select('goal_amount, goal_donors').eq('id', campaignId).single(),
        supabase
          .from('crm_donations')
          .select('amount, donation_date, contact_id')
          .eq('organization_id', organizationId)
          .eq('marketing_campaign_id', campaignId)
          .order('donation_date', { ascending: false }),
        supabase
          .from('social_posts')
          .select('id, status, platform, metrics')
          .eq('marketing_campaign_id', campaignId),
      ]);

      const list = (donations || []) as Array<{ amount: number; donation_date: string; contact_id: string }>;
      const total = list.reduce((s, d) => s + Number(d.amount || 0), 0);
      const uniqueDonors = new Set(list.map((d) => d.contact_id)).size;
      const goal = campaign?.goal_amount || null;

      const postsList = (posts || []) as Array<{ status: string; platform: string; metrics: any }>;
      const published = postsList.filter((p) => p.status === 'published' || p.status === 'scheduled').length;
      const reach = postsList.reduce((s, p) => s + Number(p.metrics?.reach || p.metrics?.impressions || 0), 0);
      const engagement = postsList.reduce(
        (s, p) => s + Number(p.metrics?.likes || 0) + Number(p.metrics?.comments || 0) + Number(p.metrics?.shares || 0),
        0,
      );
      const byPlatformMap = postsList.reduce<Record<string, number>>((acc, p) => {
        if (!p.platform) return acc;
        acc[p.platform] = (acc[p.platform] || 0) + 1;
        return acc;
      }, {});
      const byPlatform = Object.entries(byPlatformMap).map(([platform, count]) => ({ platform, count }));

      return {
        donations_count: list.length,
        donations_amount: total,
        unique_donors: uniqueDonors,
        goal_amount: goal,
        goal_donors: campaign?.goal_donors || null,
        percent_to_goal: goal ? Math.min(100, (total / goal) * 100) : 0,
        recent_donations: list.slice(0, 10),
        social_posts_total: postsList.length,
        social_posts_published: published,
        social_reach: reach,
        social_engagement: engagement,
        social_by_platform: byPlatform,
      };
    },
    enabled: !!campaignId && !!organizationId,
  });
}
