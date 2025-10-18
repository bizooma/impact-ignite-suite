import { useQuery } from "@tanstack/react-query";
import { useMobileAppData } from "@/hooks/useMobileAppData";
import { useMobileAppRealtime } from "@/hooks/useMobileAppRealtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";
import { Users, Shield, Activity } from "lucide-react";

interface MobileAppRolesManagerProps {
  organizationId: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  granted_by: string | null;
  granted_at: string;
}

interface User {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500",
  staff: "bg-blue-500",
  teacher: "bg-green-500",
  counselor: "bg-purple-500",
  caseworker: "bg-yellow-500",
  successCoach: "bg-pink-500",
  clsStaff: "bg-indigo-500",
  houseParent: "bg-orange-500",
  resident: "bg-gray-500",
};

export function MobileAppRolesManager({ organizationId }: MobileAppRolesManagerProps) {
  const { fetchTableData } = useMobileAppData(organizationId);
  const { isConnected } = useMobileAppRealtime(organizationId, true);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['mobile-app-user-roles', organizationId],
    queryFn: async () => {
      const result = await fetchTableData('user_roles', {
        columns: '*',
        orderBy: { column: 'granted_at', ascending: false }
      });
      return result.data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const { data: users } = useQuery({
    queryKey: ['mobile-app-users-for-roles', organizationId],
    queryFn: async () => {
      const result = await fetchTableData('users', {
        columns: 'id,full_name,username'
      });
      return result.data;
    },
  });

  const rolesArray = Array.isArray(userRoles) ? (userRoles as UserRole[]) : [];
  const usersArray = Array.isArray(users) ? (users as User[]) : [];

  const getUserById = (userId: string): User | undefined => {
    return usersArray.find((u: User) => u.id === userId);
  };

  const filteredRoles: UserRole[] = roleFilter === "all" 
    ? rolesArray 
    : rolesArray.filter((ur: UserRole) => ur.role === roleFilter);

  // Calculate role statistics
  const roleStats = rolesArray.reduce((acc: Record<string, number>, ur: UserRole) => {
    acc[ur.role] = (acc[ur.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (rolesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Role Assignments</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rolesArray.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(rolesArray.map((ur: UserRole) => ur.user_id)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Types</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(roleStats || {}).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
          <CardDescription>Number of users per role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(roleStats || {}).map(([role, count]) => (
              <Badge key={role} variant="secondary" className="text-sm">
                {role}: {count as number}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Role Assignments
                {isConnected && (
                  <Badge variant="outline" className="gap-1">
                    <Activity className="h-3 w-3 animate-pulse" />
                    Live
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>View all user role assignments</CardDescription>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.keys(roleStats || {}).map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Granted By</TableHead>
                <TableHead>Granted At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((userRole: UserRole) => {
                const user = getUserById(userRole.user_id);
                const grantedBy = userRole.granted_by ? getUserById(userRole.granted_by) : null;

                return (
                  <TableRow key={userRole.id}>
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
                          <div className="text-sm text-muted-foreground">@{user?.username || 'unknown'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={ROLE_COLORS[userRole.role] || 'bg-gray-500'}>
                        {userRole.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {grantedBy ? (
                        <div className="text-sm">
                          {grantedBy.full_name}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(userRole.granted_at), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(userRole.granted_at), 'h:mm a')}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
