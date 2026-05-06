import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Bell } from 'lucide-react';
import { OverviewTab } from './OverviewTab';
import { CampaignsTab } from './CampaignsTab';
import { TemplatesTab } from './TemplatesTab';
import { ContactPreferencesTab } from './ContactPreferencesTab';
import { ComplianceLogsTab } from './ComplianceLogsTab';
import { AccommodationRequestsTab } from './AccommodationRequestsTab';
import { SettingsTab } from './SettingsTab';

export function AccessNotifyDashboard({ organizationId }: { organizationId: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AccessNotify</h1>
          <p className="text-sm text-muted-foreground">
            Reach every person. Respect every ability. Document every message.
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-7 max-w-4xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="accommodations">Requests</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6"><OverviewTab organizationId={organizationId} /></TabsContent>
        <TabsContent value="campaigns" className="mt-6"><CampaignsTab organizationId={organizationId} /></TabsContent>
        <TabsContent value="templates" className="mt-6"><TemplatesTab organizationId={organizationId} /></TabsContent>
        <TabsContent value="contacts" className="mt-6"><ContactPreferencesTab organizationId={organizationId} /></TabsContent>
        <TabsContent value="compliance" className="mt-6"><ComplianceLogsTab organizationId={organizationId} /></TabsContent>
        <TabsContent value="accommodations" className="mt-6"><AccommodationRequestsTab organizationId={organizationId} /></TabsContent>
        <TabsContent value="settings" className="mt-6"><SettingsTab organizationId={organizationId} /></TabsContent>
      </Tabs>
    </div>
  );
}
