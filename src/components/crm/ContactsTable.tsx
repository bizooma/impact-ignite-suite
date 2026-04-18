import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, MoreVertical } from 'lucide-react';
import { CrmContact } from '@/hooks/useCrm';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { ContactProfile } from './ContactProfile';
import { ContactForm } from './ContactForm';
import { DeleteContactDialog } from './DeleteContactDialog';
import { AddToListDialog } from './AddToListDialog';

interface ContactsTableProps {
  contacts: CrmContact[];
  loading: boolean;
  organizationId: string;
}

export function ContactsTable({ contacts, loading, organizationId }: ContactsTableProps) {
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(null);
  const [editContact, setEditContact] = useState<CrmContact | null>(null);
  const [deleteContactState, setDeleteContactState] = useState<CrmContact | null>(null);
  const [addToListContact, setAddToListContact] = useState<CrmContact | null>(null);

  const getLifecycleColor = (stage: string) => {
    const colors: Record<string, string> = {
      lead: 'bg-blue-500',
      volunteer: 'bg-green-500',
      donor: 'bg-purple-500',
      member: 'bg-yellow-500',
      advocate: 'bg-pink-500',
      inactive: 'bg-gray-500',
    };
    return colors[stage] || 'bg-gray-500';
  };

  const getInitials = (contact: CrmContact) => {
    if (contact.first_name && contact.last_name) {
      return `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();
    }
    if (contact.organization_name) {
      return contact.organization_name.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = (contact: CrmContact) => {
    if (contact.contact_type === 'organization') {
      return contact.organization_name || 'Unnamed Organization';
    }
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact';
  };

  if (loading) {
    return <div className="text-center p-8">Loading contacts...</div>;
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Lifecycle Stage</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Last Interaction</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No contacts found. Create your first contact to get started.
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedContact(contact)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={contact.avatar_url} />
                        <AvatarFallback>{getInitials(contact)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{getDisplayName(contact)}</div>
                        <div className="flex gap-2 mt-1">
                          {contact.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{contact.email}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{contact.phone}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getLifecycleColor(contact.lifecycle_stage)}>
                      {contact.lifecycle_stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {contact.source.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    {contact.last_interaction_at ? (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(contact.last_interaction_at), 'MMM d, yyyy')}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedContact(contact); }}>
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditContact(contact); }}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setAddToListContact(contact); }}>
                          Add to List
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteContactState(contact); }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedContact && (
        <ContactProfile
          contact={selectedContact}
          open={!!selectedContact}
          onClose={() => setSelectedContact(null)}
          organizationId={organizationId}
        />
      )}

      <ContactForm
        open={!!editContact}
        onClose={() => setEditContact(null)}
        organizationId={organizationId}
        contact={editContact}
      />

      <DeleteContactDialog
        contact={deleteContactState}
        open={!!deleteContactState}
        onClose={() => setDeleteContactState(null)}
        organizationId={organizationId}
      />

      <AddToListDialog
        contact={addToListContact}
        open={!!addToListContact}
        onClose={() => setAddToListContact(null)}
        organizationId={organizationId}
      />
    </>
  );
}
