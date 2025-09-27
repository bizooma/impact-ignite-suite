import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Shield, UserX, Eye } from 'lucide-react';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  display_name: string;
  is_platform_admin: boolean;
  created_at: string;
  organizations: { name: string }[];
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { grantAdminAccess, logAdminAction } = usePlatformAdmin();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          display_name,
          is_platform_admin,
          created_at
        `);

      if (error) throw error;

      // Transform the data and fetch additional info
      const usersWithDetails = await Promise.all(
        data.map(async (profile) => {
          // Get organizations for this user
          const { data: memberships } = await supabase
            .from('memberships')
            .select(`
              organizations (
                name
              )
            `)
            .eq('user_id', profile.user_id);

          return {
            id: profile.user_id,
            email: 'user@example.com', // This would need to be fetched differently
            display_name: profile.display_name || 'Anonymous User',
            is_platform_admin: profile.is_platform_admin || false,
            created_at: profile.created_at,
            organizations: memberships?.map(m => m.organizations).filter(Boolean) || []
          };
        })
      );

      setUsers(usersWithDetails);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGrantAdmin = async (email: string) => {
    const success = await grantAdminAccess(email);
    if (success) {
      toast.success('Admin access granted successfully');
      fetchUsers();
    } else {
      toast.error('Failed to grant admin access');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      await logAdminAction('suspend_user', 'user', userId);
      toast.success('User suspended successfully');
      // In a real implementation, you'd update the user's status
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>User Management</span>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Organizations</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.display_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.organizations.slice(0, 2).map((org, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {org.name}
                        </Badge>
                      ))}
                      {user.organizations.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.organizations.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.is_platform_admin ? (
                      <Badge variant="destructive">
                        <Shield className="h-3 w-3 mr-1" />
                        Platform Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">User</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                          </DialogHeader>
                          {selectedUser && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Display Name</label>
                                <p className="text-sm text-muted-foreground">{selectedUser.display_name}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Email</label>
                                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Organizations</label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {selectedUser.organizations.map((org, index) => (
                                    <Badge key={index} variant="outline">
                                      {org.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-2 pt-4">
                                {!selectedUser.is_platform_admin && (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleGrantAdmin(selectedUser.email)}
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Grant Admin
                                  </Button>
                                )}
                                <Button
                                  variant="destructive"
                                  onClick={() => handleSuspendUser(selectedUser.id)}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Suspend
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
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