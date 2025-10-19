import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CrmContact {
  id: string;
  organization_id: string;
  contact_type: 'individual' | 'organization' | 'foundation';
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  email?: string;
  phone?: string;
  address?: any;
  social_profiles?: any;
  source: string;
  source_id?: string;
  lifecycle_stage: 'lead' | 'volunteer' | 'donor' | 'member' | 'advocate' | 'inactive';
  rating?: number;
  tags?: string[];
  custom_fields?: any;
  avatar_url?: string;
  opted_in_email?: boolean;
  opted_in_sms?: boolean;
  total_donations?: number;
  total_volunteer_hours?: number;
  last_interaction_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CrmList {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  list_type: 'static' | 'dynamic';
  filter_rules?: any;
  color?: string;
  icon?: string;
  contact_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CrmInteraction {
  id: string;
  contact_id: string;
  organization_id: string;
  interaction_type: string;
  subject?: string;
  description?: string;
  metadata?: any;
  source_module?: string;
  source_id?: string;
  interaction_date: string;
  created_by?: string;
  created_at: string;
}

export function useCrm(organizationId: string) {
  const queryClient = useQueryClient();

  // Fetch all contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['crm-contacts', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CrmContact[];
    },
    enabled: !!organizationId,
  });

  // Fetch all lists
  const { data: lists, isLoading: listsLoading } = useQuery({
    queryKey: ['crm-lists', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_lists')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      return data as CrmList[];
    },
    enabled: !!organizationId,
  });

  // Fetch interactions for a contact
  const getContactInteractions = async (contactId: string) => {
    const { data, error } = await supabase
      .from('crm_interactions')
      .select('*')
      .eq('contact_id', contactId)
      .order('interaction_date', { ascending: false });

    if (error) throw error;
    return data as CrmInteraction[];
  };

  // Create contact
  const createContact = useMutation({
    mutationFn: async (contact: Partial<CrmContact>) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert([{ ...contact, organization_id: organizationId } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts', organizationId] });
      toast.success('Contact created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create contact: ${error.message}`);
    },
  });

  // Update contact
  const updateContact = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CrmContact> }) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts', organizationId] });
      toast.success('Contact updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });

  // Delete contact
  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts', organizationId] });
      toast.success('Contact deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete contact: ${error.message}`);
    },
  });

  // Create list
  const createList = useMutation({
    mutationFn: async (list: Partial<CrmList>) => {
      const { data, error } = await supabase
        .from('crm_lists')
        .insert([{ ...list, organization_id: organizationId } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-lists', organizationId] });
      toast.success('List created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create list: ${error.message}`);
    },
  });

  // Add contact to list
  const addContactToList = useMutation({
    mutationFn: async ({ listId, contactId }: { listId: string; contactId: string }) => {
      const { error } = await supabase
        .from('crm_list_memberships')
        .insert({ list_id: listId, contact_id: contactId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-lists', organizationId] });
      toast.success('Contact added to list');
    },
    onError: (error: any) => {
      toast.error(`Failed to add contact to list: ${error.message}`);
    },
  });

  // Log interaction
  const logInteraction = useMutation({
    mutationFn: async (interaction: Partial<CrmInteraction>) => {
      const { data, error } = await supabase
        .from('crm_interactions')
        .insert([{ ...interaction, organization_id: organizationId } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Interaction logged successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to log interaction: ${error.message}`);
    },
  });

  return {
    contacts,
    contactsLoading,
    lists,
    listsLoading,
    getContactInteractions,
    createContact,
    updateContact,
    deleteContact,
    createList,
    addContactToList,
    logInteraction,
  };
}
