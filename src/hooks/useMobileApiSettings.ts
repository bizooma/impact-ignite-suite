import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useMobileApiSettings(organizationId: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['mobile-api-settings', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, mobile_api_key, mobile_api_enabled')
        .eq('id', organizationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const generateKey = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('generate_mobile_api_key', { _org_id: organizationId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mobile-api-settings', organizationId] });
      toast.success('New mobile API key generated');
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to generate key'),
  });

  const setEnabled = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('organizations')
        .update({ mobile_api_enabled: enabled })
        .eq('id', organizationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mobile-api-settings', organizationId] });
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to update'),
  });

  return { ...query, generateKey, setEnabled };
}
