import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMobileAppData } from '@/hooks/useMobileAppData';
import { useMobileAppRealtime } from '@/hooks/useMobileAppRealtime';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Download, ArrowRight, Activity } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import Papa from 'papaparse';
import { toast } from 'sonner';

interface MobileAppRoleHistoryProps {
  organizationId: string;
}

interface RoleChange {
  id: string;
  user_id: string;
  role: string;
  granted_by: string | null;
  granted_at: string;
  previous_role?: string;
}

interface User {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
}

export function MobileAppRoleHistory({ organizationId }: MobileAppRoleHistoryProps) {
  const { fetchTableData } = useMobileAppData(organizationId);
  const { isConnected } = useMobileAppRealtime(organizationId, true);
  const [userFilter, setUserFilter] = useState<string>('all');

  // Fetch role history
  const { data: roleHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['mobile-app-role-history', organizationId],
    queryFn: async () => {
      const result = await fetchTableData('user_roles', {
        columns: '*',
        orderBy: { column: 'granted_at', ascending: false },
      });
      return result.data as RoleChange[];
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Fetch users for display
  const { data: users } = useQuery({
    queryKey: ['mobile-app-users-for-history', organizationId],
    queryFn: async () => {
      const result = await fetchTableData('users', {
        columns: 'id,full_name,username',
      });
      return result.data as User[];
    },
  });

  const historyArray = Array.isArray(roleHistory) ? roleHistory : [];
  const usersArray = Array.isArray(users) ? users : [];

  const getUserById = (userId: string): User | undefined => {
    return usersArray.find((u: User) => u.id === userId);
  };

  // Filter by user
  const filteredHistory = userFilter === 'all'
    ? historyArray
    : historyArray.filter((r) => r.user_id === userFilter);

  // Calculate statistics
  const todayChanges = historyArray.filter((r) => isToday(new Date(r.granted_at))).length;
  const weekChanges = historyArray.filter((r) => isThisWeek(new Date(r.granted_at))).length;
  const monthChanges = historyArray.filter((r) => isThisMonth(new Date(r.granted_at))).length;

  // Get unique users who have had role changes
  const usersWithChanges = Array.from(
    new Set(historyArray.map((r) => r.user_id))
  ).map((userId) => getUserById(userId)).filter(Boolean) as User[];

  const exportToCSV = () => {
    if (filteredHistory.length === 0) {
      toast.error('No role history to export');
      return;
    }

    const csvData = filteredHistory.map((change) => {
      const user = getUserById(change.user_id);
      const grantedBy = change.granted_by ? getUserById(change.granted_by) : null;
      
      return {
        'User': user?.full_name || 'Unknown',
        'Username': user?.username || 'Unknown',
        'Role': change.role,
        'Granted By': grantedBy?.full_name || 'System',
        'Granted At': format(new Date(change.granted_at), 'yyyy-MM-dd HH:mm:ss'),
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `role-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast.success(`Exported ${filteredHistory.length} role changes to CSV`);
  };

  if (historyLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Changes Today</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayChanges}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Changes This Week</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekChanges}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Changes This Month</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthChanges}</div>
          </CardContent>
        </Card>
      </div>

      {/* Role History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Role Change History
                {isConnected && (
                  <Badge variant="outline" className="ml-2 gap-1">
                    <Activity className="h-3 w-3 animate-pulse" />
                    Live
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Complete audit trail of all role changes
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {usersWithChanges.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={filteredHistory.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No role changes found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role Change</TableHead>
                    <TableHead>Granted By</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((change) => {
                    const user = getUserById(change.user_id);
                    const grantedBy = change.granted_by ? getUserById(change.granted_by) : null;

                    return (
                      <TableRow key={change.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user?.avatar_url} />
                              <AvatarFallback>
                                {user?.full_name?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user?.full_name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">
                                @{user?.username || 'unknown'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {change.previous_role && (
                              <>
                                <Badge variant="outline">{change.previous_role}</Badge>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              </>
                            )}
                            <Badge variant="default">{change.role}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {grantedBy ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={grantedBy.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {grantedBy.full_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{grantedBy.full_name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(change.granted_at), 'MMM d, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(change.granted_at), 'h:mm a')}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
