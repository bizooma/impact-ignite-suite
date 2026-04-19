import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CampaignAsset {
  id: string;
  campaign_id: string;
  asset_type: 'social_post' | 'email_draft' | 'sms_draft' | 'task' | 'qr_code' | 'chatbot_faq' | 'landing_section' | 'gbp_post';
  asset_id: string | null;
  title: string;
  body: string | null;
  scheduled_for: string | null;
  status: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface CampaignMilestone {
  id: string;
  campaign_id: string;
  phase: 'awareness' | 'engagement' | 'push' | 'day_of' | 'stewardship';
  title: string;
  description: string | null;
  due_date: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'skipped';
  owner_id: string | null;
  order_index: number;
}

export function useCampaignAssets(campaignId: string) {
  const qc = useQueryClient();

  const { data: assets, isLoading } = useQuery({
    queryKey: ['campaign-assets', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_assets')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as CampaignAsset[];
    },
    enabled: !!campaignId,
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CampaignAsset> }) => {
      const { error } = await supabase.from('campaign_assets').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign-assets', campaignId] }),
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  return { assets, isLoading, updateAsset };
}

export function useCampaignMilestones(campaignId: string) {
  const qc = useQueryClient();

  const { data: milestones, isLoading } = useQuery({
    queryKey: ['campaign-milestones', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_milestones')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as CampaignMilestone[];
    },
    enabled: !!campaignId,
  });

  const updateMilestone = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CampaignMilestone> }) => {
      const { error } = await supabase.from('campaign_milestones').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign-milestones', campaignId] }),
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  return { milestones, isLoading, updateMilestone };
}
