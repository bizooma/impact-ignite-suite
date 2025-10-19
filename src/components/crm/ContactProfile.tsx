import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CrmContact } from '@/hooks/useCrm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ContactProfileProps {
  contact: CrmContact;
  open: boolean;
  onClose: () => void;
  organizationId: string;
}

export function ContactProfile({ contact, open, onClose, organizationId }: ContactProfileProps) {
  const getInitials = () => {
    if (contact.first_name && contact.last_name) {
      return `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();
    }
    if (contact.organization_name) {
      return contact.organization_name.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (contact.contact_type === 'organization') {
      return contact.organization_name || 'Unnamed Organization';
    }
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={contact.avatar_url} />
              <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{getDisplayName()}</h2>
              <div className="flex gap-2 mt-2">
                <Badge>{contact.lifecycle_stage}</Badge>
                {contact.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">${contact.total_donations || 0}</div>
                <p className="text-sm text-muted-foreground">Total Donations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{contact.total_volunteer_hours || 0}</div>
                <p className="text-sm text-muted-foreground">Volunteer Hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">
                      {contact.last_interaction_at 
                        ? format(new Date(contact.last_interaction_at), 'MMM d, yyyy')
                        : 'Never'}
                    </div>
                    <p className="text-xs text-muted-foreground">Last Interaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="donations">Donations</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contact Type</p>
                      <p className="mt-1">{contact.contact_type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Source</p>
                      <p className="mt-1">{contact.source.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email Opt-in</p>
                      <p className="mt-1">{contact.opted_in_email ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">SMS Opt-in</p>
                      <p className="mt-1">{contact.opted_in_sms ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interactions">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Interaction history coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="donations">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Donation history coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Notes coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
