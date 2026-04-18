import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CrmNote {
  id: string;
  organization_id: string;
  contact_id: string;
  author_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export function useCrmNotes(organizationId: string, contactId: string) {
  const qc = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['crm-notes', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_notes')
        .select('*')
        .eq('contact_id', contactId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CrmNote[];
    },
    enabled: !!contactId,
  });

  const createNote = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('crm_notes').insert({
        organization_id: organizationId,
        contact_id: contactId,
        author_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-notes', contactId] });
      toast.success('Note added');
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase.from('crm_notes').update({ is_pinned }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-notes', contactId] }),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-notes', contactId] });
      toast.success('Note deleted');
    },
  });

  return { notes, isLoading, createNote, togglePin, deleteNote };
}
