import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone } from 'lucide-react';
import { EventsManager } from './EventsManager';
import { StoriesManager } from './StoriesManager';
import { MobileApiSettings } from './MobileApiSettings';

interface Props { organizationId: string }

export function MobileContentDashboard({ organizationId }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Smartphone className="h-8 w-8" /> Mobile Content
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage events, success stories, and API access for your mobile app.
        </p>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="stories">Success Stories</TabsTrigger>
          <TabsTrigger value="api">API Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="mt-6">
          <EventsManager organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="stories" className="mt-6">
          <StoriesManager organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="api" className="mt-6">
          <MobileApiSettings organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
