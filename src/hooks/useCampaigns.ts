import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import {
  MILESTONES,
  TASKS,
  ALL_ASSETS,
  getNextGivingTuesday,
  formatLocalDate,
} from '@/lib/campaignTemplates/givingTuesday';

export interface MarketingCampaign {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  template_key: string | null;
  goal_amount: number | null;
  goal_donors: number | null;
  goal_currency: string;
  start_date: string | null;
  end_date: string | null;
  event_date: string | null;
  theme_color: string;
  hero_image_url: string | null;
  tagline: string | null;
  story: string | null;
  audience_segments: any;
  channels: any;
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useCampaigns(organizationId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['marketing-campaigns', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MarketingCampaign[];
    },
    enabled: !!organizationId,
  });

  const createCampaign = useMutation({
    mutationFn: async (input: Partial<MarketingCampaign>) => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert([{ ...input, organization_id: organizationId, created_by: user?.id } as any])
        .select()
        .single();
      if (error) throw error;
      return data as MarketingCampaign;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-campaigns', organizationId] });
      toast.success('Campaign created');
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  const createFromGivingTuesday = useMutation({
    mutationFn: async (overrides?: { name?: string; goal_amount?: number; goal_donors?: number }) => {
      const eventDate = getNextGivingTuesday();
      const startDate = new Date(eventDate);
      startDate.setDate(eventDate.getDate() - 56); // 8 weeks before
      const endDate = new Date(eventDate);
      endDate.setDate(eventDate.getDate() + 14); // 2 weeks after for stewardship

      const slug = `giving-tuesday-${eventDate.getFullYear()}-${Date.now().toString(36)}`;

      const { data: campaign, error } = await supabase
        .from('marketing_campaigns')
        .insert([{
          organization_id: organizationId,
          name: overrides?.name || `Giving Tuesday ${eventDate.getFullYear()}`,
          slug,
          template_key: 'giving_tuesday',
          goal_amount: overrides?.goal_amount ?? 25000,
          goal_donors: overrides?.goal_donors ?? 100,
          goal_currency: 'USD',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          event_date: eventDate.toISOString().split('T')[0],
          theme_color: '#dc2626',
          tagline: 'One day. Endless impact.',
          status: 'draft',
          created_by: user?.id,
          channels: { social: true, email: true, sms: false, chatbot: true, qr: true, gbp: true },
        } as any])
        .select()
        .single();
      if (error) throw error;

      // Seed milestones
      const milestoneRows = MILESTONES.map((m) => {
        const due = new Date(eventDate);
        due.setDate(eventDate.getDate() - m.weeksOffset * 7);
        return {
          campaign_id: campaign.id,
          phase: m.phase,
          title: m.title,
          description: m.description,
          due_date: due.toISOString().split('T')[0],
          order_index: m.order_index,
        };
      });
      await supabase.from('campaign_milestones').insert(milestoneRows as any);

      // Seed assets (drafts)
      const assetRows = ALL_ASSETS.map((a) => ({
        campaign_id: campaign.id,
        asset_type: a.asset_type,
        title: a.title,
        body: a.body,
        status: 'draft',
        metadata: a.metadata || {},
      }));
      await supabase.from('campaign_assets').insert(assetRows as any);

      // Seed tasks
      const taskRows = TASKS.map((t) => {
        const due = new Date(eventDate);
        due.setDate(eventDate.getDate() - t.weeksOffset * 7);
        return {
          organization_id: organizationId,
          title: t.title,
          description: t.description,
          due_date: due.toISOString().split('T')[0],
          priority: t.priority,
          source_module: 'campaigns',
          source_id: campaign.id,
          marketing_campaign_id: campaign.id,
        };
      });
      await supabase.from('tasks').insert(taskRows as any);

      return campaign as MarketingCampaign;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-campaigns', organizationId] });
      toast.success('Giving Tuesday campaign created with timeline, content, and tasks!');
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MarketingCampaign> }) => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['marketing-campaigns', organizationId] });
      qc.invalidateQueries({ queryKey: ['marketing-campaign', id] });
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-campaigns', organizationId] });
      toast.success('Campaign deleted');
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  return { campaigns, isLoading, createCampaign, createFromGivingTuesday, updateCampaign, deleteCampaign };
}

export function useCampaign(campaignId: string) {
  return useQuery({
    queryKey: ['marketing-campaign', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      if (error) throw error;
      return data as MarketingCampaign;
    },
    enabled: !!campaignId,
  });
}
