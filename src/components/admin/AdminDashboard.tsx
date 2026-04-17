import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from './UserManagement';
import { OrganizationManagement } from './OrganizationManagement';
import { PlatformAnalytics } from './PlatformAnalytics';
import { AdminAuditLogs } from './AdminAuditLogs';
import { MobileAppSeeding } from './MobileAppSeeding';
import { FlipbookManager } from './FlipbookManager';
import { BetaSignupsManager } from './BetaSignupsManager';
import { Shield, Users, Building2, BarChart3, FileText, Smartphone, BookOpen, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformStats {
  totalUsers: number;
  userGrowthPct: number;
  totalOrganizations: number;
  orgGrowthPct: number;
  activeSessions: number;
  systemHealth: number;
}

const formatPct = (n: number) => `${n >= 0 ? '+' : ''}${n}%`;

export function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('admin-actions', {
          body: { action: 'platform_stats' },
        });
        if (error) throw error;
        setStats(data?.data ?? null);
      } catch (err) {
        console.error('Failed to load platform stats', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const display = (v: number | undefined) =>
    loading ? '—' : (v ?? 0).toLocaleString();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Platform Administration</h1>
          <p className="text-muted-foreground">
            Manage users, organizations, and platform settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{display(stats?.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading…' : `${formatPct(stats?.userGrowthPct ?? 0)} from last month`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{display(stats?.totalOrganizations)}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading…' : `${formatPct(stats?.orgGrowthPct ?? 0)} from last month`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{display(stats?.activeSessions)}</div>
            <p className="text-xs text-muted-foreground">
              Active in last 15 minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{loading ? '—' : `${stats?.systemHealth ?? 100}%`}</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="beta-signups" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Beta Signups
          </TabsTrigger>
          <TabsTrigger value="mobile-apps" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Mobile Apps
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="flipbooks" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Flipbooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <OrganizationManagement />
        </TabsContent>

        <TabsContent value="beta-signups" className="space-y-4">
          <BetaSignupsManager />
        </TabsContent>

        <TabsContent value="mobile-apps" className="space-y-4">
          <MobileAppSeeding />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <PlatformAnalytics />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AdminAuditLogs />
        </TabsContent>

        <TabsContent value="flipbooks" className="space-y-4">
          <FlipbookManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}