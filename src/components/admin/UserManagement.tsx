import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  display_name?: string;
  is_platform_admin: boolean;
  created_at: string;
  last_sign_in_at?: string | null;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
}

const formatLastLogin = (value?: string | null) => {
  if (!value) return 'Never';
  const d = new Date(value);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export function UserManagement() {
  const { logAdminAction } = usePlatformAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'list_users'
        }
      });

      if (response.error) {
        throw response.error;
      }

      setUsers(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGrantAdmin = async (user: User) => {
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'grant_admin',
          data: { email: user.email }
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast.success(`Platform admin access granted to ${user.email}`);
      fetchUsers(); // Refresh the list
      setSelectedUser(null);
    } catch (error) {
      console.error('Error granting admin access:', error);
      toast.error('Failed to grant admin access');
    }
  };

  const handleSuspendUser = async (user: User) => {
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'suspend_user',
          targetUserId: user.id,
          data: { reason: 'Suspended by platform admin' }
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast.success(`User ${user.email} has been suspended`);
      fetchUsers(); // Refresh the list
      setSelectedUser(null);
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Loading users...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage platform users, roles, and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Organizations</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.display_name || 'No name'}</p>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.organizations.length > 0 ? (
                        user.organizations.map((org) => (
                          <Badge key={org.id} variant="secondary" className="text-xs">
                            {org.name} ({org.role})
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No organizations</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.is_platform_admin ? (
                      <Badge variant="destructive">Platform Admin</Badge>
                    ) : (
                      <Badge variant="secondary">User</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatLastLogin(user.last_sign_in_at)}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>User Details</DialogTitle>
                          <DialogDescription>
                            Manage user permissions and view detailed information
                          </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold">Basic Information</h4>
                              <p><strong>Name:</strong> {selectedUser.display_name || 'No name set'}</p>
                              <p><strong>Email:</strong> {selectedUser.email}</p>
                              <p><strong>Created:</strong> {new Date(selectedUser.created_at).toLocaleString()}</p>
                              <p><strong>Last Login:</strong> {formatLastLogin(selectedUser.last_sign_in_at)}</p>
                              <p><strong>Platform Admin:</strong> {selectedUser.is_platform_admin ? 'Yes' : 'No'}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold">Organizations</h4>
                              {selectedUser.organizations.length > 0 ? (
                                <div className="space-y-2">
                                  {selectedUser.organizations.map((org) => (
                                    <div key={org.id} className="p-2 border rounded">
                                      <p><strong>{org.name}</strong> ({org.slug})</p>
                                      <p className="text-sm text-muted-foreground">Role: {org.role}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-muted-foreground">Not a member of any organizations</p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {!selectedUser.is_platform_admin && (
                                <Button 
                                  variant="destructive"
                                  onClick={() => handleGrantAdmin(selectedUser)}
                                >
                                  Grant Admin
                                </Button>
                              )}
                              <Button 
                                variant="outline"
                                onClick={() => handleSuspendUser(selectedUser)}
                              >
                                Suspend
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}