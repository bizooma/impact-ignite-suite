import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAccessNotifyCampaigns(organizationId: string) {
  return useQuery({
    queryKey: ['accessnotify-campaigns', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accessnotify_campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAccessNotifyTemplates(organizationId: string) {
  return useQuery({
    queryKey: ['accessnotify-templates', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accessnotify_templates')
        .select('*')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .order('is_starter', { ascending: false })
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAccessNotifyComplianceLogs(organizationId: string) {
  return useQuery({
    queryKey: ['accessnotify-logs', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accessnotify_compliance_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sent_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAccessNotifyAccommodations(organizationId: string) {
  return useQuery({
    queryKey: ['accessnotify-accommodations', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accessnotify_accommodation_requests')
        .select('*')
        .eq('organization_id', organizationId)
        .order('received_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAccessNotifyPreferences(organizationId: string) {
  return useQuery({
    queryKey: ['accessnotify-prefs', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accessnotify_preferences')
        .select('*')
        .eq('organization_id', organizationId);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAccessNotifySettings(organizationId: string) {
  return useQuery({
    queryKey: ['accessnotify-settings', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accessnotify_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertSettings(organizationId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { error } = await supabase
        .from('accessnotify_settings')
        .upsert({ organization_id: organizationId, ...values }, { onConflict: 'organization_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accessnotify-settings', organizationId] });
      toast({ title: 'Settings saved' });
    },
    onError: (e: any) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  });
}
