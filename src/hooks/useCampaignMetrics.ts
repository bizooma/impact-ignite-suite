import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  amount: number;
  count: number;
}

export interface CampaignMetrics {
  donations_count: number;
  donations_amount: number;
  unique_donors: number;
  goal_amount: number | null;
  goal_donors: number | null;
  percent_to_goal: number;
  percent_to_donor_goal: number;
  avg_gift: number;
  recent_donations: Array<{ amount: number; donation_date: string; contact_id: string }>;
  daily_donations: DailyPoint[];

  social_posts_total: number;
  social_posts_published: number;
  social_reach: number;
  social_engagement: number;
  social_by_platform: Array<{ platform: string; count: number }>;

  qr_codes_count: number;
  qr_scans_total: number;
  qr_scans_last_30: number;

  interactions_count: number;
  interactions_by_type: Array<{ type: string; count: number }>;

  tasks_total: number;
  tasks_completed: number;
  tasks_overdue: number;
  task_completion_pct: number;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export function useCampaignMetrics(campaignId: string, organizationId: string) {
  return useQuery({
    queryKey: ['campaign-metrics', campaignId],
    queryFn: async (): Promise<CampaignMetrics> => {
      const [
        { data: campaign },
        { data: donations },
        { data: posts },
        { data: qrCodes },
        { data: interactions },
        { data: tasks },
      ] = await Promise.all([
        supabase.from('marketing_campaigns').select('goal_amount, goal_donors').eq('id', campaignId).single(),
        supabase
          .from('crm_donations')
          .select('amount, donation_date, contact_id')
          .eq('organization_id', organizationId)
          .eq('marketing_campaign_id', campaignId)
          .order('donation_date', { ascending: false }),
        supabase
          .from('social_posts')
          .select('id, status, platform, metadata')
          .eq('marketing_campaign_id', campaignId),
        supabase
          .from('qr_codes')
          .select('id, qr_scans(count)')
          .eq('organization_id', organizationId)
          .eq('marketing_campaign_id', campaignId),
        supabase
          .from('crm_interactions')
          .select('interaction_type')
          .eq('organization_id', organizationId)
          .eq('marketing_campaign_id', campaignId),
        supabase
          .from('tasks')
          .select('id, status, due_date')
          .eq('organization_id', organizationId)
          .eq('marketing_campaign_id', campaignId),
      ]);

      // ── Donations ────────────────────────────────────────────
      const list = (donations || []) as Array<{ amount: number; donation_date: string; contact_id: string }>;
      const total = list.reduce((s, d) => s + Number(d.amount || 0), 0);
      const uniqueDonors = new Set(list.map((d) => d.contact_id)).size;
      const goal = campaign?.goal_amount || null;
      const donorGoal = campaign?.goal_donors || null;
      const avgGift = list.length ? total / list.length : 0;

      // Daily roll-up (last 30 days that have data)
      const dayMap = new Map<string, { amount: number; count: number }>();
      list.forEach((d) => {
        const day = (d.donation_date || '').slice(0, 10);
        if (!day) return;
        const cur = dayMap.get(day) || { amount: 0, count: 0 };
        cur.amount += Number(d.amount || 0);
        cur.count += 1;
        dayMap.set(day, cur);
      });
      const daily: DailyPoint[] = [...dayMap.entries()]
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // ── Social ───────────────────────────────────────────────
      const postsList = (posts || []) as Array<{ status: string; platform: string; metadata: any }>;
      const published = postsList.filter((p) => p.status === 'published' || p.status === 'scheduled').length;
      const reach = postsList.reduce((s, p) => s + Number(p.metadata?.reach || p.metadata?.impressions || 0), 0);
      const engagement = postsList.reduce(
        (s, p) => s + Number(p.metadata?.likes || 0) + Number(p.metadata?.comments || 0) + Number(p.metadata?.shares || 0),
        0,
      );
      const byPlatformMap = postsList.reduce<Record<string, number>>((acc, p) => {
        if (!p.platform) return acc;
        acc[p.platform] = (acc[p.platform] || 0) + 1;
        return acc;
      }, {});
      const byPlatform = Object.entries(byPlatformMap).map(([platform, count]) => ({ platform, count }));

      // ── QR codes ─────────────────────────────────────────────
      const qrList = (qrCodes || []) as Array<{ id: string; qr_scans: Array<{ count: number }> }>;
      const qrScansTotal = qrList.reduce((s, q) => s + (q.qr_scans?.[0]?.count || 0), 0);

      // Last-30-day scans needs an extra query (only if we have any QR codes attached)
      let qrScansLast30 = 0;
      if (qrList.length > 0) {
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const ids = qrList.map((q) => q.id);
        const { count } = await supabase
          .from('qr_scans')
          .select('id', { count: 'exact', head: true })
          .in('qr_code_id', ids)
          .gte('scanned_at', since.toISOString());
        qrScansLast30 = count || 0;
      }

      // ── Interactions ─────────────────────────────────────────
      const ints = (interactions || []) as Array<{ interaction_type: string }>;
      const intByTypeMap = ints.reduce<Record<string, number>>((acc, i) => {
        const t = i.interaction_type || 'other';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      const intByType = Object.entries(intByTypeMap).map(([type, count]) => ({ type, count }));

      // ── Tasks ────────────────────────────────────────────────
      const tList = (tasks || []) as Array<{ status: string; due_date: string | null }>;
      const tasksDone = tList.filter((t) => t.status === 'done' || t.status === 'completed').length;
      const today = todayIso();
      const tasksOverdue = tList.filter(
        (t) => t.status !== 'done' && t.status !== 'completed' && t.due_date && t.due_date < today,
      ).length;

      return {
        donations_count: list.length,
        donations_amount: total,
        unique_donors: uniqueDonors,
        goal_amount: goal,
        goal_donors: donorGoal,
        percent_to_goal: goal ? Math.min(100, (total / goal) * 100) : 0,
        percent_to_donor_goal: donorGoal ? Math.min(100, (uniqueDonors / donorGoal) * 100) : 0,
        avg_gift: avgGift,
        recent_donations: list.slice(0, 10),
        daily_donations: daily,

        social_posts_total: postsList.length,
        social_posts_published: published,
        social_reach: reach,
        social_engagement: engagement,
        social_by_platform: byPlatform,

        qr_codes_count: qrList.length,
        qr_scans_total: qrScansTotal,
        qr_scans_last_30: qrScansLast30,

        interactions_count: ints.length,
        interactions_by_type: intByType,

        tasks_total: tList.length,
        tasks_completed: tasksDone,
        tasks_overdue: tasksOverdue,
        task_completion_pct: tList.length ? Math.round((tasksDone / tList.length) * 100) : 0,
      };
    },
    enabled: !!campaignId && !!organizationId,
  });
}
