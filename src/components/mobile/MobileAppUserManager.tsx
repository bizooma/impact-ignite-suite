import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMobileAppData } from '@/hooks/useMobileAppData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  UserPlus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  MessageSquare,
  Shield,
  UserCheck,
  UserX,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { UserFormDialog } from './UserFormDialog';
import { UserChatHistory } from './UserChatHistory';
import { UserCSVImport } from './UserCSVImport';
import { UserRoleManager } from './UserRoleManager';

interface User {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  role: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  assigned_resident_ids: string[];
  assigned_staff_ids: string[];
}

interface MobileAppUserManagerProps {
  organizationId: string;
}

export function MobileAppUserManager({ organizationId }: MobileAppUserManagerProps) {
  const { fetchTableData, deleteData, updateData, isExecuting } = useMobileAppData(organizationId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch users
  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['mobile-app-users', organizationId],
    queryFn: async () => {
      const result = await fetchTableData('users', {
        columns: '*',
        orderBy: { column: 'created_at', ascending: false },
      });
      return result.data as User[];
    },
  });

  const users = usersData || [];

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleActive = async (user: User) => {
    try {
      await updateData('users', { is_active: !user.is_active }, { id: user.id });
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`);
      refetch();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteData('users', { id: selectedUser.id });
      toast.success('User deleted successfully');
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleViewChats = (user: User) => {
    setSelectedUser(user);
    setShowChatHistory(true);
  };

  const handleManageRoles = (user: User) => {
    setSelectedUser(user);
    setShowRoleManager(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'admin') return 'default';
    if (role === 'staff') return 'secondary';
    return 'outline';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage users for your mobile app
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCSVImport(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingUser(null);
                  setShowUserForm(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredUsers.length} of {users.length} users
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {searchTerm ? 'No users found matching your search' : 'No users yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.full_name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{user.username}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>{user.phone_number || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageRoles(user)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Manage Roles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewChats(user)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              View Chats
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                              {user.is_active ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <UserFormDialog
        open={showUserForm}
        onOpenChange={setShowUserForm}
        user={editingUser}
        organizationId={organizationId}
        onSuccess={() => {
          refetch();
          setShowUserForm(false);
          setEditingUser(null);
        }}
      />

      {/* CSV Import Dialog */}
      <UserCSVImport
        open={showCSVImport}
        onOpenChange={setShowCSVImport}
        organizationId={organizationId}
        onSuccess={refetch}
      />

      {/* Chat History Dialog */}
      {selectedUser && (
        <UserChatHistory
          open={showChatHistory}
          onOpenChange={setShowChatHistory}
          user={selectedUser}
          organizationId={organizationId}
        />
      )}

      {/* Role Manager Dialog */}
      {selectedUser && (
        <UserRoleManager
          open={showRoleManager}
          onOpenChange={setShowRoleManager}
          user={selectedUser}
          organizationId={organizationId}
          onSuccess={refetch}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.full_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={isExecuting}
            >
              Delete User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
