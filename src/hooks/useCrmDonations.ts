import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CrmDonation {
  id: string;
  organization_id: string;
  contact_id: string;
  campaign_id?: string | null;
  amount: number;
  currency?: string;
  donation_date: string;
  payment_method?: string | null;
  is_recurring?: boolean;
  recurrence_frequency?: string | null;
  transaction_id?: string | null;
  tax_deductible?: boolean;
  notes?: string | null;
  acknowledgment_sent?: boolean;
  created_at: string;
  updated_at: string;
}

export function useCrmDonations(organizationId: string, contactId?: string) {
  const qc = useQueryClient();

  const { data: donations, isLoading } = useQuery({
    queryKey: ['crm-donations', organizationId, contactId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('crm_donations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('donation_date', { ascending: false });
      if (contactId) q = q.eq('contact_id', contactId);
      const { data, error } = await q;
      if (error) throw error;
      return data as CrmDonation[];
    },
    enabled: !!organizationId,
  });

  const createDonation = useMutation({
    mutationFn: async (input: Partial<CrmDonation>) => {
      const { data, error } = await supabase
        .from('crm_donations')
        .insert([{ ...input, organization_id: organizationId } as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-donations', organizationId] });
      qc.invalidateQueries({ queryKey: ['crm-contacts', organizationId] });
      toast.success('Donation recorded');
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  return { donations, isLoading, createDonation };
}
