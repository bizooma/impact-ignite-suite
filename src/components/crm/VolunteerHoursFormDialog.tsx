import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { z } from 'zod';
import { useCrmVolunteerHours } from '@/hooks/useCrmVolunteerHours';
import { useCrm } from '@/hooks/useCrm';
import { useToast } from '@/components/ui/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  contactId?: string;
}

// Hours must be positive. Cap at 24 since a single session > 24h almost
// certainly means a typo and would skew volunteer reports.
const hoursSchema = z
  .number({ message: 'Hours must be a number' })
  .finite('Hours must be a valid number')
  .gt(0, 'Hours must be greater than zero')
  .max(24, 'Hours per entry cannot exceed 24');

export function VolunteerHoursFormDialog({ open, onClose, organizationId, contactId }: Props) {
  const { createHours } = useCrmVolunteerHours(organizationId);
  const { contacts } = useCrm(organizationId);
  const { toast } = useToast();
  const [selectedContactId, setSelectedContactId] = useState(contactId || '');
  const [activity, setActivity] = useState('');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cid = contactId || selectedContactId;
    if (!cid) return;

    const parsed = parseFloat(hours);
    const result = hoursSchema.safeParse(parsed);
    if (!result.success) {
      toast({
        title: 'Invalid hours',
        description: result.error.issues[0]?.message ?? 'Please enter a positive number of hours.',
        variant: 'destructive',
      });
      return;
    }

    await createHours.mutateAsync({
      contact_id: cid,
      activity,
      hours: result.data,
      volunteer_date: date,
      location,
      supervisor,
      notes,
    });
    setActivity(''); setHours(''); setLocation(''); setSupervisor(''); setNotes('');
    onClose();
  };

  const getName = (c: any) => c.contact_type === 'organization'
    ? c.organization_name
    : `${c.first_name || ''} ${c.last_name || ''}`.trim();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Volunteer Hours</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!contactId && (
            <div>
              <Label>Volunteer</Label>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                <SelectContent>
                  {contacts?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{getName(c) || 'Unnamed'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Activity</Label>
            <Input value={activity} onChange={(e) => setActivity(e.target.value)} required maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Hours</Label>
              <Input type="number" step="0.25" min="0" value={hours} onChange={(e) => setHours(e.target.value)} required />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label>Supervisor</Label>
            <Input value={supervisor} onChange={(e) => setSupervisor(e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createHours.isPending}>Log</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
