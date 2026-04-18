import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CrmVolunteerHours {
  id: string;
  organization_id: string;
  contact_id: string;
  activity: string;
  hours: number;
  volunteer_date: string;
  location?: string | null;
  supervisor?: string | null;
  notes?: string | null;
  approved?: boolean;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export function useCrmVolunteerHours(organizationId: string, contactId?: string) {
  const qc = useQueryClient();

  const { data: hours, isLoading } = useQuery({
    queryKey: ['crm-volunteer-hours', organizationId, contactId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('crm_volunteer_hours')
        .select('*')
        .eq('organization_id', organizationId)
        .order('volunteer_date', { ascending: false });
      if (contactId) q = q.eq('contact_id', contactId);
      const { data, error } = await q;
      if (error) throw error;
      return data as CrmVolunteerHours[];
    },
    enabled: !!organizationId,
  });

  const createHours = useMutation({
    mutationFn: async (input: Partial<CrmVolunteerHours>) => {
      const { data, error } = await supabase
        .from('crm_volunteer_hours')
        .insert([{ ...input, organization_id: organizationId } as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-volunteer-hours', organizationId] });
      qc.invalidateQueries({ queryKey: ['crm-contacts', organizationId] });
      toast.success('Hours logged');
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  const setApproval = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('crm_volunteer_hours')
        .update({
          approved,
          approved_by: approved ? user?.id : null,
          approved_at: approved ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-volunteer-hours', organizationId] });
      toast.success('Updated');
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  return { hours, isLoading, createHours, setApproval };
}
