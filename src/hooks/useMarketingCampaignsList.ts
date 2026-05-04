import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarketingCampaignOption {
  id: string;
  name: string;
  status: string;
  event_date: string | null;
}

/**
 * Lightweight picker-friendly list of marketing campaigns for the current org.
 * Returns active + draft campaigns ordered by most-recent event_date.
 */
export function useMarketingCampaignsList(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['marketing-campaigns-list', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('id, name, status, event_date')
        .eq('organization_id', organizationId!)
        .in('status', ['draft', 'active'])
        .order('event_date', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data || []) as MarketingCampaignOption[];
    },
    enabled: !!organizationId,
  });
}
