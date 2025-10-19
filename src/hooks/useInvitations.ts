import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  expires_at: string;
  created_at: string;
  inviter?: {
    display_name: string | null;
  };
}

export function useInvitations(organizationId: string) {
  const queryClient = useQueryClient();

  // Fetch pending invitations
  const { data: invitations, isLoading } = useQuery({
    queryKey: ['invitations', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch inviter profiles separately
      if (data && data.length > 0) {
        const inviterIds = data.map(inv => inv.invited_by);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', inviterIds);
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        return data.map(inv => ({
          ...inv,
          inviter: profileMap.get(inv.invited_by) || null
        })) as Invitation[];
      }
      
      return data as Invitation[];
    },
  });

  // Send invitation
  const sendInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'admin' | 'editor' | 'viewer' }) => {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: { organizationId, email, role },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['memberships', organizationId] });
      toast.success('Invitation sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send invitation');
    },
  });

  // Cancel invitation
  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('organization_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', organizationId] });
      toast.success('Invitation cancelled');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel invitation');
    },
  });

  // Resend invitation
  const resendInvitation = useMutation({
    mutationFn: async (invitation: Invitation) => {
      // Cancel old invitation
      await supabase
        .from('organization_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitation.id);

      // Send new invitation
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: { 
          organizationId: invitation.organization_id, 
          email: invitation.email, 
          role: invitation.role 
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', organizationId] });
      toast.success('Invitation resent successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to resend invitation');
    },
  });

  // Check if organization is at member limit
  const checkMemberLimit = async (): Promise<{ atLimit: boolean; currentCount: number }> => {
    const { count: memberCount } = await supabase
      .from('memberships')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const { count: pendingInviteCount } = await supabase
      .from('organization_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending');

    const totalCount = (memberCount || 0) + (pendingInviteCount || 0);
    return {
      atLimit: totalCount >= 5,
      currentCount: totalCount,
    };
  };

  return {
    invitations: invitations || [],
    isLoading,
    sendInvitation,
    cancelInvitation,
    resendInvitation,
    checkMemberLimit,
  };
}
