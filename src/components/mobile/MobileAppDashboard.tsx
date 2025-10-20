import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMobileAppData } from '@/hooks/useMobileAppData';
import { Smartphone, Users, Shield, MessageSquare, Settings, ShieldAlert, FileText, History } from 'lucide-react';
import calFarleysLogo from '@/assets/cal-farleys-logo.jpg';
import { MobileAppUserManager } from './MobileAppUserManager';
import { MobileAppSettings } from './MobileAppSettings';
import { MobileAppRolesManager } from './MobileAppRolesManager';
import { MobileAppChatsViewer } from './MobileAppChatsViewer';
import { MobileAppAuditLogs } from './MobileAppAuditLogs';
import { MobileAppRoleHistory } from './MobileAppRoleHistory';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MobileAppDashboardProps {
  organizationId: string;
}

export function MobileAppDashboard({ organizationId }: MobileAppDashboardProps) {
  const { user } = useAuth();
  const { dbConfig, configLoading, hasMobileApp, isActive } = useMobileAppData(organizationId);
  const [activeTab, setActiveTab] = useState('users');

  // Check if user is admin for this organization
  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ['org-membership', user?.id, organizationId],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !!organizationId,
  });

  // Fetch organization brand color for theming
  const { data: orgData } = useQuery({
    queryKey: ['organization-theme', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, brand_color')
        .eq('id', organizationId)
        .single();
      return data;
    },
    enabled: !!organizationId,
  });

  if (configLoading || membershipLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading mobile app configuration...</p>
        </div>
      </div>
    );
  }

  // Check admin access
  if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You need administrator access to manage the mobile app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Admin Access Required</AlertTitle>
              <AlertDescription>
                Only organization administrators and owners can access mobile app management.
                Please contact your organization owner for access.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasMobileApp) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              No Mobile App Connected
            </CardTitle>
            <CardDescription>
              This organization doesn't have a mobile app database configured yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              To connect a mobile app, you'll need an organization code. Contact your platform administrator
              to get your mobile app configured.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <img src={calFarleysLogo} alt="Cal Farley's Boys Ranch" className="h-16 w-16 rounded-full object-cover" />
            <Smartphone className="h-8 w-8" />
            Mobile App Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your mobile app data and settings
          </p>
        </div>
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Database Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Database Name</p>
              <p className="font-medium">{dbConfig?.database_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Organization Code</p>
              <p className="font-medium font-mono">{dbConfig?.organization_code}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Synced</p>
              <p className="font-medium">
                {dbConfig?.last_synced_at 
                  ? new Date(dbConfig.last_synced_at).toLocaleString()
                  : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium">{isActive ? 'Connected' : 'Disconnected'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList 
          className="grid w-full grid-cols-6"
          style={orgData?.brand_color ? {
            backgroundColor: orgData.brand_color,
            borderColor: orgData.brand_color
          } : undefined}
        >
          <TabsTrigger 
            value="users" 
            className="flex items-center gap-2"
            data-brand-styled={!!orgData?.brand_color}
          >
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger 
            value="roles" 
            className="flex items-center gap-2"
            data-brand-styled={!!orgData?.brand_color}
          >
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex items-center gap-2"
            data-brand-styled={!!orgData?.brand_color}
          >
            <History className="h-4 w-4" />
            Role History
          </TabsTrigger>
          <TabsTrigger 
            value="chats" 
            className="flex items-center gap-2"
            data-brand-styled={!!orgData?.brand_color}
          >
            <MessageSquare className="h-4 w-4" />
            Chats
          </TabsTrigger>
          <TabsTrigger 
            value="audit" 
            className="flex items-center gap-2"
            data-brand-styled={!!orgData?.brand_color}
          >
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="flex items-center gap-2"
            data-brand-styled={!!orgData?.brand_color}
          >
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <MobileAppUserManager organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <MobileAppRolesManager organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <MobileAppRoleHistory organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="chats" className="mt-6">
          <MobileAppChatsViewer organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <MobileAppAuditLogs organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <MobileAppSettings organizationId={organizationId} dbConfig={dbConfig} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
