import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Flipbook {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  pdf_url: string;
  thumbnail_url?: string;
  page_count?: number;
  file_size?: number;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlipbookEmbed {
  id: string;
  flipbook_id: string;
  organization_id: string;
  position: number;
  created_at: string;
  flipbooks?: Flipbook;
}

export const useFlipbooks = () => {
  const queryClient = useQueryClient();

  const { data: flipbooks, isLoading } = useQuery({
    queryKey: ['flipbooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flipbooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Flipbook[];
    },
  });

  const uploadPDF = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('flipbooks')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('flipbooks')
        .getPublicUrl(filePath);

      return { publicUrl, filePath };
    },
  });

  const createFlipbook = useMutation({
    mutationFn: async (flipbookData: {
      title: string;
      description?: string;
      pdf_url: string;
      thumbnail_url?: string;
      page_count?: number;
      file_size?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('manage-flipbook', {
        body: { action: 'create', flipbookData },
      });

      if (error) throw error;
      return data.flipbook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flipbooks'] });
      toast.success('Flipbook created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create flipbook: ${error.message}`);
    },
  });

  const updateFlipbook = useMutation({
    mutationFn: async (flipbookData: Partial<Flipbook> & { id: string }) => {
      const { data, error } = await supabase.functions.invoke('manage-flipbook', {
        body: { action: 'update', flipbookData },
      });

      if (error) throw error;
      return data.flipbook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flipbooks'] });
      toast.success('Flipbook updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update flipbook: ${error.message}`);
    },
  });

  const deleteFlipbook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke('manage-flipbook', {
        body: { action: 'delete', flipbookData: { id } },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flipbooks'] });
      toast.success('Flipbook deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete flipbook: ${error.message}`);
    },
  });

  return {
    flipbooks,
    isLoading,
    uploadPDF,
    createFlipbook,
    updateFlipbook,
    deleteFlipbook,
  };
};

export const useFlipbookEmbeds = (organizationId?: string) => {
  const queryClient = useQueryClient();

  const { data: embeds, isLoading } = useQuery({
    queryKey: ['flipbook-embeds', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('flipbook_embeds')
        .select('*, flipbooks(*)')
        .eq('organization_id', organizationId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as FlipbookEmbed[];
    },
    enabled: !!organizationId,
  });

  const assignFlipbook = useMutation({
    mutationFn: async ({
      flipbookId,
      organizationIds,
      position,
    }: {
      flipbookId: string;
      organizationIds: string[];
      position?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('assign-flipbook-embed', {
        body: { action: 'assign', flipbookId, organizationIds, position },
      });

      if (error) throw error;
      return data.embeds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flipbook-embeds'] });
      toast.success('Flipbook assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign flipbook: ${error.message}`);
    },
  });

  const unassignFlipbook = useMutation({
    mutationFn: async ({
      flipbookId,
      organizationIds,
    }: {
      flipbookId: string;
      organizationIds: string[];
    }) => {
      const { error } = await supabase.functions.invoke('assign-flipbook-embed', {
        body: { action: 'unassign', flipbookId, organizationIds },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flipbook-embeds'] });
      toast.success('Flipbook unassigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unassign flipbook: ${error.message}`);
    },
  });

  return {
    embeds,
    isLoading,
    assignFlipbook,
    unassignFlipbook,
  };
};
