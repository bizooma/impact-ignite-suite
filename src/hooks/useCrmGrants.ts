import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type GrantStage =
  | 'researching' | 'loi' | 'proposal_drafting' | 'submitted'
  | 'awarded' | 'declined' | 'reporting' | 'closed';

export const GRANT_STAGES: { key: GrantStage; label: string }[] = [
  { key: 'researching', label: 'Researching' },
  { key: 'loi', label: 'LOI' },
  { key: 'proposal_drafting', label: 'Drafting' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'awarded', label: 'Awarded' },
  { key: 'declined', label: 'Declined' },
  { key: 'reporting', label: 'Reporting' },
  { key: 'closed', label: 'Closed' },
];

export interface CrmGrant {
  id: string;
  organization_id: string;
  foundation_name: string;
  grant_name: string;
  amount_requested: number | null;
  amount_awarded: number | null;
  stage: GrantStage;
  deadline: string | null;
  submitted_date: string | null;
  decision_date: string | null;
  contact_id: string | null;
  owner_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCrmGrants(organizationId: string) {
  const qc = useQueryClient();

  const { data: grants, isLoading } = useQuery({
    queryKey: ['crm-grants', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_grants' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('deadline', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as unknown as CrmGrant[];
    },
  });

  const createGrant = useMutation({
    mutationFn: async (input: Partial<CrmGrant>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('crm_grants' as any)
        .insert([{ ...input, organization_id: organizationId, owner_id: input.owner_id ?? user?.id } as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-grants', organizationId] });
      toast.success('Grant created');
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  const updateGrant = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CrmGrant> }) => {
      const { error } = await supabase.from('crm_grants' as any).update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-grants', organizationId] });
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  const deleteGrant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_grants' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-grants', organizationId] });
      toast.success('Grant deleted');
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  return { grants, isLoading, createGrant, updateGrant, deleteGrant };
}
