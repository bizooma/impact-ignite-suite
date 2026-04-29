import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Check, X, UserPlus2 } from 'lucide-react';

type JoinRequest = {
  id: string;
  organization_id: string;
  user_id: string;
  requested_email: string;
  requested_role: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

interface JoinRequestsManagerProps {
  organizationId: string;
}

export function JoinRequestsManager({ organizationId }: JoinRequestsManagerProps) {
  const queryClient = useQueryClient();
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['org-join-requests', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_join_requests')
        .select('id, organization_id, user_id, requested_email, requested_role, status, created_at')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as JoinRequest[];
    },
  });

  const decide = useMutation({
    mutationFn: async ({
      requestId,
      decision,
      role,
    }: {
      requestId: string;
      decision: 'approve' | 'reject';
      role: 'viewer' | 'editor' | 'admin';
    }) => {
      const { error } = await supabase.rpc('decide_org_join_request', {
        p_request_id: requestId,
        p_decision: decision,
        p_role: role,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.decision === 'approve' ? 'Request approved' : 'Request rejected');
      queryClient.invalidateQueries({ queryKey: ['org-join-requests', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['org-members', organizationId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update request');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Join Requests</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus2 className="h-5 w-5" />
          Pending Join Requests
          <Badge variant="secondary">{requests.length}</Badge>
        </CardTitle>
        <CardDescription>
          People who entered your mobile app code and are waiting for approval. They have no access
          until you approve.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Role on approval</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => {
              const selectedRole = pendingRoles[r.id] ?? 'viewer';
              const isPending = decide.isPending;
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.requested_email || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={selectedRole}
                      onValueChange={(v) => setPendingRoles((s) => ({ ...s, [r.id]: v }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() =>
                        decide.mutate({ requestId: r.id, decision: 'reject', role: 'viewer' })
                      }
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() =>
                        decide.mutate({
                          requestId: r.id,
                          decision: 'approve',
                          role: selectedRole as 'viewer' | 'editor' | 'admin',
                        })
                      }
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
