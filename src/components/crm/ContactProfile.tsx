import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CrmContact, useCrm, CrmInteraction } from '@/hooks/useCrm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, Calendar, Pencil, Trash2, Plus, Pin, PinOff, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { ContactForm } from './ContactForm';
import { DeleteContactDialog } from './DeleteContactDialog';
import { InteractionLogDialog } from './InteractionLogDialog';
import { DonationFormDialog } from './DonationFormDialog';
import { TaxStatementDialog } from './TaxStatementDialog';
import { AcknowledgmentDraftDialog } from './AcknowledgmentDraftDialog';
import { useCrmDonations } from '@/hooks/useCrmDonations';
import { useCrmNotes } from '@/hooks/useCrmNotes';
import { useOrganization } from '@/hooks/useOrganization';
import { ConstituentTimeline } from './ConstituentTimeline';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContactProfileProps {
  contact: CrmContact;
  open: boolean;
  onClose: () => void;
  organizationId: string;
}

export function ContactProfile({ contact, open, onClose, organizationId }: ContactProfileProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showLogInteraction, setShowLogInteraction] = useState(false);
  const [showRecordDonation, setShowRecordDonation] = useState(false);
  const [showTaxStatement, setShowTaxStatement] = useState(false);
  const [draftDonation, setDraftDonation] = useState<any | null>(null);
  const [noteContent, setNoteContent] = useState('');

  const { donations } = useCrmDonations(organizationId, contact.id);
  const { notes, createNote, togglePin, deleteNote } = useCrmNotes(organizationId, contact.id);
  const { organization } = useOrganization();

  const { data: interactions } = useQuery({
    queryKey: ['crm-interactions', contact.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_interactions')
        .select('*')
        .eq('contact_id', contact.id)
        .order('interaction_date', { ascending: false });
      if (error) throw error;
      return data as CrmInteraction[];
    },
    enabled: open,
  });

  // Close profile after delete
  useEffect(() => {
    if (!showDelete) return;
  }, [showDelete]);

  const getInitials = () => {
    if (contact.first_name && contact.last_name) {
      return `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();
    }
    if (contact.organization_name) return contact.organization_name.substring(0, 2).toUpperCase();
    return 'U';
  };

  const getDisplayName = () => {
    if (contact.contact_type === 'organization') {
      return contact.organization_name || 'Unnamed Organization';
    }
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact';
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    await createNote.mutateAsync(noteContent.trim());
    setNoteContent('');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={contact.avatar_url} />
                <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{getDisplayName()}</h2>
                    <div className="flex gap-2 mt-2">
                      <Badge>{contact.lifecycle_stage}</Badge>
                      {contact.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowDelete(true)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
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

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">${Number(contact.total_donations || 0).toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Total Donations</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{Number(contact.total_volunteer_hours || 0)}</div>
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

            <Tabs defaultValue="timeline">
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="interactions">Interactions</TabsTrigger>
                <TabsTrigger value="donations">Donations</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline">
                <ConstituentTimeline contactId={contact.id} organizationId={organizationId} />
              </TabsContent>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Contact Type</p>
                        <p className="mt-1 capitalize">{contact.contact_type}</p>
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
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Interactions</CardTitle>
                    <Button size="sm" onClick={() => setShowLogInteraction(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Log Interaction
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {!interactions || interactions.length === 0 ? (
                      <p className="text-center py-6 text-muted-foreground">No interactions logged yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {interactions.map((i) => (
                          <div key={i.id} className="border-l-2 border-primary pl-3 py-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <Badge variant="outline" className="capitalize">{i.interaction_type}</Badge>
                                <span className="ml-2 font-medium">{i.subject}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(i.interaction_date), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                            {i.description && (
                              <p className="text-sm text-muted-foreground mt-1">{i.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="donations">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Donations</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowTaxStatement(true)} disabled={!donations || donations.length === 0}>
                        <FileText className="h-4 w-4 mr-1" /> Tax Statement
                      </Button>
                      <Button size="sm" onClick={() => setShowRecordDonation(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Record Donation
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!donations || donations.length === 0 ? (
                      <p className="text-center py-6 text-muted-foreground">No donations recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {donations.map((d) => (
                          <div key={d.id} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <p className="font-semibold">${Number(d.amount).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {(d.payment_method || '').replace(/_/g, ' ')}
                                {d.is_recurring && ' • Recurring'}
                                {d.acknowledgment_sent && ' • ✓ Acknowledged'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(d.donation_date), 'MMM d, yyyy')}
                              </span>
                              {!d.acknowledgment_sent && (
                                <Button size="sm" variant="ghost" onClick={() => setDraftDonation(d)}>
                                  <Mail className="h-3 w-3 mr-1" /> Thank you
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes">
                <Card>
                  <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add a note..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        maxLength={2000}
                      />
                      <Button size="sm" onClick={handleAddNote} disabled={!noteContent.trim() || createNote.isPending}>
                        Add Note
                      </Button>
                    </div>

                    {!notes || notes.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground">No notes yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {notes.map((n) => (
                          <div key={n.id} className={`p-3 border rounded ${n.is_pinned ? 'bg-muted/50' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm whitespace-pre-wrap flex-1">{n.content}</p>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => togglePin.mutate({ id: n.id, is_pinned: !n.is_pinned })}
                                >
                                  {n.is_pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => deleteNote.mutate(n.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(n.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <ContactForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        organizationId={organizationId}
        contact={contact}
      />

      <DeleteContactDialog
        contact={contact}
        open={showDelete}
        onClose={() => { setShowDelete(false); onClose(); }}
        organizationId={organizationId}
      />

      <InteractionLogDialog
        open={showLogInteraction}
        onClose={() => setShowLogInteraction(false)}
        organizationId={organizationId}
        contactId={contact.id}
      />

      <DonationFormDialog
        open={showRecordDonation}
        onClose={() => setShowRecordDonation(false)}
        organizationId={organizationId}
        contactId={contact.id}
      />

      <TaxStatementDialog
        open={showTaxStatement}
        onClose={() => setShowTaxStatement(false)}
        contact={contact}
        organizationId={organizationId}
      />

      {draftDonation && (
        <AcknowledgmentDraftDialog
          open={!!draftDonation}
          onClose={() => setDraftDonation(null)}
          donation={draftDonation}
          contact={contact}
          organizationName={organization?.name || 'our organization'}
        />
      )}
    </>
  );
}
