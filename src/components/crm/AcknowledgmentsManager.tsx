import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Mail, Check, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { useCrmDonations } from '@/hooks/useCrmDonations';
import { useCrm } from '@/hooks/useCrm';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import { AcknowledgmentDraftDialog } from './AcknowledgmentDraftDialog';
import type { CrmContact } from '@/hooks/useCrm';

interface Props { organizationId: string; }

export function AcknowledgmentsManager({ organizationId }: Props) {
  const { donations, isLoading, markAcknowledged } = useCrmDonations(organizationId);
  const { contacts } = useCrm(organizationId);
  const { currentOrganization } = useOrganization();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [draftFor, setDraftFor] = useState<{ donation: any; contact: CrmContact } | null>(null);

  const contactMap = useMemo(() => {
    const m = new Map<string, CrmContact>();
    contacts?.forEach(c => m.set(c.id, c));
    return m;
  }, [contacts]);

  const pending = useMemo(
    () => (donations || []).filter(d => !d.acknowledgment_sent),
    [donations]
  );

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === pending.length) setSelected(new Set());
    else setSelected(new Set(pending.map(d => d.id)));
  };

  const handleBulkMark = async () => {
    if (selected.size === 0) return;
    await markAcknowledged.mutateAsync(Array.from(selected));
    setSelected(new Set());
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Acknowledgments</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {pending.length} donation{pending.length === 1 ? '' : 's'} awaiting thank-you
          </p>
        </div>
        {selected.size > 0 && (
          <Button onClick={handleBulkMark} disabled={markAcknowledged.isPending} size="sm">
            <Check className="h-4 w-4 mr-2" />
            Mark {selected.size} acknowledged
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : pending.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Check className="h-10 w-10 mx-auto mb-2 text-success" />
            <p>All donations acknowledged. Great work!</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selected.size === pending.length && pending.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map(d => {
                const contact = contactMap.get(d.contact_id);
                const name = contact
                  ? (contact.contact_type === 'organization'
                      ? contact.organization_name || 'Unnamed'
                      : `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed')
                  : 'Unknown';
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Checkbox checked={selected.has(d.id)} onCheckedChange={() => toggle(d.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-sm">
                      {contact?.email || <Badge variant="outline">No email</Badge>}
                    </TableCell>
                    <TableCell>${Number(d.amount).toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(d.donation_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => contact && setDraftFor({ donation: d, contact })}
                          disabled={!contact}
                        >
                          <Mail className="h-3 w-3 mr-1" /> Draft email
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAcknowledged.mutate([d.id])}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {draftFor && (
        <AcknowledgmentDraftDialog
          open={!!draftFor}
          onClose={() => setDraftFor(null)}
          donation={draftFor.donation}
          contact={draftFor.contact}
          organizationName={currentOrganization?.name || 'our organization'}
          onMarkSent={() => {
            markAcknowledged.mutate([draftFor.donation.id]);
            setDraftFor(null);
          }}
        />
      )}
    </Card>
  );
}
