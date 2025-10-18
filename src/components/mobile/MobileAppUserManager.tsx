import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMobileAppData } from '@/hooks/useMobileAppData';
import { useMobileAppRealtime } from '@/hooks/useMobileAppRealtime';
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
  Upload,
  Download,
  CheckSquare,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
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
  const { fetchTableData, deleteData, updateData, isExecuting, getCount } = useMobileAppData(organizationId);
  const { isConnected } = useMobileAppRealtime(organizationId, true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Fetch total count
  const { data: totalCount } = useQuery({
    queryKey: ['mobile-app-users-count', organizationId],
    queryFn: async () => {
      const result = await getCount('users');
      return result.data?.count || 0;
    },
  });

  // Fetch users with pagination
  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['mobile-app-users', organizationId, currentPage],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const result = await fetchTableData('users', {
        columns: '*',
        orderBy: { column: 'created_at', ascending: false },
        limit: itemsPerPage,
        offset: offset,
      });
      return result.data as User[];
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const users = usersData || [];
  const total = totalCount || 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedUsers(new Set()); // Clear selections when changing pages
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

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

  const exportUsersToCSV = () => {
    const csvData = users.map(user => ({
      'Full Name': user.full_name,
      'Username': user.username,
      'Email': user.email || '',
      'Phone': user.phone_number || '',
      'Role': user.role,
      'Status': user.is_active ? 'Active' : 'Inactive',
      'Created': format(new Date(user.created_at), 'yyyy-MM-dd'),
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast.success(`Exported ${users.length} users to CSV`);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const selectAllUsers = () => {
    setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
  };

  const deselectAllUsers = () => {
    setSelectedUsers(new Set());
  };

  const handleBulkRoleChange = async (newRole: string) => {
    if (selectedUsers.size === 0) {
      toast.error('No users selected');
      return;
    }

    try {
      for (const userId of selectedUsers) {
        await updateData('users', { role: newRole }, { id: userId });
      }
      toast.success(`Updated ${selectedUsers.size} users to role: ${newRole}`);
      setSelectedUsers(new Set());
      refetch();
    } catch (error) {
      console.error('Error updating roles:', error);
      toast.error('Failed to update roles');
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.size === 0) {
      toast.error('No users selected');
      return;
    }

    try {
      for (const userId of selectedUsers) {
        await updateData('users', { is_active: true }, { id: userId });
      }
      toast.success(`Activated ${selectedUsers.size} users`);
      setSelectedUsers(new Set());
      refetch();
    } catch (error) {
      console.error('Error activating users:', error);
      toast.error('Failed to activate users');
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUsers.size === 0) {
      toast.error('No users selected');
      return;
    }

    try {
      for (const userId of selectedUsers) {
        await updateData('users', { is_active: false }, { id: userId });
      }
      toast.success(`Deactivated ${selectedUsers.size} users`);
      setSelectedUsers(new Set());
      refetch();
    } catch (error) {
      console.error('Error deactivating users:', error);
      toast.error('Failed to deactivate users');
    }
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
              <CardTitle className="flex items-center gap-2">
                User Management
                {isConnected && (
                  <Badge variant="outline" className="gap-1">
                    <Activity className="h-3 w-3 animate-pulse" />
                    Live
                  </Badge>
                )}
              </CardTitle>
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
              {selectedUsers.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Bulk Actions ({selectedUsers.size})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleBulkRoleChange('admin')}>
                      Set as Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkRoleChange('staff')}>
                      Set as Staff
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkRoleChange('resident')}>
                      Set as Resident
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleBulkActivate}>
                      Activate All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBulkDeactivate}>
                      Deactivate All
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username, email, or role..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportUsersToCSV()}
              disabled={users.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </Button>
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, total)} of {total} users
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAllUsers();
                      } else {
                        deselectAllUsers();
                      }
                    }}
                  />
                </TableHead>
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
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      {searchTerm ? 'No users found matching your search' : 'No users yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </TableCell>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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
