import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, Trash2, UserCog, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { InviteMemberDialog } from './InviteMemberDialog';
import { PendingInvitations } from './PendingInvitations';
import { useInvitations } from '@/hooks/useInvitations';

interface MembershipManagementProps {
  organizationId: string;
}

interface Membership {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'viewer' | 'editor';
  created_at: string;
  profile?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function MembershipManagement({ organizationId }: MembershipManagementProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [memberToDelete, setMemberToDelete] = useState<Membership | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { invitations } = useInvitations(organizationId);

  // Fetch all memberships for this organization
  const { data: memberships, isLoading } = useQuery({
    queryKey: ['memberships', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch profiles separately for each user
      if (data) {
        const userIds = data.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);
        
        // Merge profiles data
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        return data.map(m => ({
          ...m,
          profile: profileMap.get(m.user_id) || null
        }));
      }
      
      return [];
    },
  });

  // Update member role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ membershipId, newRole }: { membershipId: string; newRole: 'admin' | 'viewer' | 'editor' }) => {
      const { error } = await supabase
        .from('memberships')
        .update({ role: newRole })
        .eq('id', membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships', organizationId] });
      toast.success('Member role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update member role');
    },
  });

  // Delete member
  const deleteMemberMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships', organizationId] });
      toast.success('Member removed successfully');
      setMemberToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove member');
      setMemberToDelete(null);
    },
  });

  const handleRoleChange = (membershipId: string, newRole: 'admin' | 'viewer' | 'editor') => {
    updateRoleMutation.mutate({ membershipId, newRole });
  };

  const handleDeleteMember = () => {
    if (memberToDelete) {
      deleteMemberMutation.mutate(memberToDelete.id);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Loading members...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalMemberCount = (memberships?.length || 0) + (invitations?.length || 0);
  const atLimit = totalMemberCount >= 5;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Team Members ({totalMemberCount}/5)
              </CardTitle>
              <CardDescription>
                Manage team members and their roles in your organization
              </CardDescription>
            </div>
            <Button 
              onClick={() => setInviteDialogOpen(true)}
              disabled={atLimit}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships?.map((membership) => {
                const isCurrentUser = membership.user_id === user?.id;
                const isOwner = membership.role === 'owner';

                return (
                  <TableRow key={membership.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {membership.profile?.avatar_url ? (
                          <img
                            src={membership.profile.avatar_url}
                            alt={membership.profile.display_name || 'User'}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <Shield className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {membership.profile?.display_name || 'Unknown User'}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isOwner ? (
                        <Badge variant={getRoleBadgeVariant(membership.role)}>
                          {membership.role}
                        </Badge>
                      ) : (
                        <Select
                          value={membership.role}
                          onValueChange={(value) => handleRoleChange(membership.id, value as 'admin' | 'viewer' | 'editor')}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(membership.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isCurrentUser && !isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMemberToDelete(membership)}
                          disabled={deleteMemberMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PendingInvitations organizationId={organizationId} />

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        organizationId={organizationId}
        currentMemberCount={totalMemberCount}
      />

      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>{memberToDelete?.profile?.display_name || 'this member'}</strong> from the
              organization? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
