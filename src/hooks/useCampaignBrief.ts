import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CampaignObjective =
  | 'fundraise'
  | 'awareness'
  | 'recruit_volunteers'
  | 'event_attendance'
  | 'advocacy'
  | 'stewardship';

export type CampaignTone = 'warm' | 'urgent' | 'celebratory' | 'professional' | 'playful';
export type BriefStatus = 'draft' | 'complete';

export interface CampaignBrief {
  id: string;
  campaign_id: string;
  organization_id: string;
  objective: CampaignObjective;
  primary_goal_amount: number | null;
  primary_goal_donors: number | null;
  goal_currency: string;
  audience_description: string | null;
  audience_segments: any;
  key_message: string | null;
  tone: CampaignTone;
  call_to_action: string | null;
  landing_url: string | null;
  channels: any;
  start_date: string | null;
  end_date: string | null;
  event_date: string | null;
  theme_color: string;
  hero_image_url: string | null;
  status: BriefStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useCampaignBrief(campaignId: string | undefined) {
  const qc = useQueryClient();

  const { data: brief, isLoading } = useQuery({
    queryKey: ['campaign-brief', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_briefs')
        .select('*')
        .eq('campaign_id', campaignId!)
        .maybeSingle();
      if (error) throw error;
      return data as CampaignBrief | null;
    },
    enabled: !!campaignId,
  });

  const upsertBrief = useMutation({
    mutationFn: async (input: Partial<CampaignBrief> & { campaign_id: string; organization_id: string }) => {
      const { data, error } = await supabase
        .from('campaign_briefs')
        .upsert(input as any, { onConflict: 'campaign_id' })
        .select()
        .single();
      if (error) throw error;
      return data as CampaignBrief;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['campaign-brief', vars.campaign_id] });
      qc.invalidateQueries({ queryKey: ['marketing-campaigns'] });
    },
    onError: (e: any) => toast.error(`Failed to save brief: ${e.message}`),
  });

  return { brief, isLoading, upsertBrief };
}
