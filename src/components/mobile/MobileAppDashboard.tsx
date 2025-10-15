import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMobileAppData } from '@/hooks/useMobileAppData';
import { Smartphone, Database, Activity, Settings } from 'lucide-react';
import { MobileAppDataManager } from './MobileAppDataManager';
import { MobileAppSettings } from './MobileAppSettings';
import { MobileAppAnalytics } from './MobileAppAnalytics';
import { Badge } from '@/components/ui/badge';

interface MobileAppDashboardProps {
  organizationId: string;
}

export function MobileAppDashboard({ organizationId }: MobileAppDashboardProps) {
  const { dbConfig, configLoading, hasMobileApp, isActive } = useMobileAppData(organizationId);
  const [activeTab, setActiveTab] = useState('data');

  if (configLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading mobile app configuration...</p>
        </div>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Manager
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-6">
          <MobileAppDataManager organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <MobileAppAnalytics organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <MobileAppSettings organizationId={organizationId} dbConfig={dbConfig} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
