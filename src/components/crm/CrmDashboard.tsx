import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserCircle, Users, Heart, Clock, Activity, Plus } from 'lucide-react';
import { ContactsTable } from './ContactsTable';
import { ListsManager } from './ListsManager';
import { MailchimpSyncSettings } from './MailchimpSyncSettings';
import { DonationsManager } from './DonationsManager';
import { VolunteerHoursManager } from './VolunteerHoursManager';
import { useCrm } from '@/hooks/useCrm';
import { useState } from 'react';
import { ContactForm } from './ContactForm';

interface CrmDashboardProps {
  organizationId: string;
}

export function CrmDashboard({ organizationId }: CrmDashboardProps) {
  const { contacts, contactsLoading, lists, listsLoading } = useCrm(organizationId);
  const [showContactForm, setShowContactForm] = useState(false);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const stats = {
    totalContacts: contacts?.length || 0,
    volunteers: contacts?.filter(c => c.lifecycle_stage === 'volunteer').length || 0,
    donors: contacts?.filter(c => c.lifecycle_stage === 'donor').length || 0,
    newThisMonth: contacts?.filter(c => new Date(c.created_at) >= monthStart).length || 0,
    activeThisMonth: contacts?.filter(c => c.last_interaction_at && new Date(c.last_interaction_at) >= monthStart).length || 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCircle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">CRM</h1>
            <p className="text-muted-foreground">
              Manage your constituent relationships
            </p>
          </div>
        </div>
        <Button onClick={() => setShowContactForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volunteers</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.volunteers}</div>
            <p className="text-xs text-muted-foreground">
              Active volunteers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Donors</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.donors}</div>
            <p className="text-xs text-muted-foreground">
              Total donors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Contacts with recent activity
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="lists">Lists</TabsTrigger>
          <TabsTrigger value="mailchimp">Mailchimp Sync</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="volunteers">Volunteer Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <ContactsTable 
            contacts={contacts || []} 
            loading={contactsLoading}
            organizationId={organizationId}
          />
        </TabsContent>

        <TabsContent value="lists">
          <ListsManager 
            lists={lists || []} 
            loading={listsLoading}
            organizationId={organizationId}
          />
        </TabsContent>

        <TabsContent value="mailchimp">
          <MailchimpSyncSettings 
            organizationId={organizationId}
            lists={lists || []}
          />
        </TabsContent>

        <TabsContent value="donations">
          <DonationsManager organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="volunteers">
          <VolunteerHoursManager organizationId={organizationId} />
        </TabsContent>
      </Tabs>

      <ContactForm
        open={showContactForm}
        onClose={() => setShowContactForm(false)}
        organizationId={organizationId}
      />
    </div>
  );
}
