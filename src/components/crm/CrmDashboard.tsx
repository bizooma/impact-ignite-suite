import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserCircle, Users, Heart, Clock, TrendingUp, Plus } from 'lucide-react';
import { ContactsTable } from './ContactsTable';
import { ListsManager } from './ListsManager';
import { useCrm } from '@/hooks/useCrm';
import { useState } from 'react';
import { ContactForm } from './ContactForm';

interface CrmDashboardProps {
  organizationId: string;
}

export function CrmDashboard({ organizationId }: CrmDashboardProps) {
  const { contacts, contactsLoading, lists, listsLoading } = useCrm(organizationId);
  const [showContactForm, setShowContactForm] = useState(false);

  const stats = {
    totalContacts: contacts?.length || 0,
    volunteers: contacts?.filter(c => c.lifecycle_stage === 'volunteer').length || 0,
    donors: contacts?.filter(c => c.lifecycle_stage === 'donor').length || 0,
    newThisMonth: contacts?.filter(c => {
      const createdAt = new Date(c.created_at);
      const now = new Date();
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length || 0,
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
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              Response rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="lists">Lists</TabsTrigger>
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

        <TabsContent value="donations">
          <Card>
            <CardHeader>
              <CardTitle>Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Donation tracking coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volunteers">
          <Card>
            <CardHeader>
              <CardTitle>Volunteer Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Volunteer hour tracking coming soon...</p>
            </CardContent>
          </Card>
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
