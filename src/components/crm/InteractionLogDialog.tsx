import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useCrm } from '@/hooks/useCrm';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  contactId: string;
}

export function InteractionLogDialog({ open, onClose, organizationId, contactId }: Props) {
  const { logInteraction } = useCrm(organizationId);
  const qc = useQueryClient();
  const [type, setType] = useState('email');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await logInteraction.mutateAsync({
      contact_id: contactId,
      interaction_type: type,
      subject,
      description,
      interaction_date: new Date().toISOString(),
    });
    qc.invalidateQueries({ queryKey: ['crm-interactions', contactId] });
    setSubject(''); setDescription(''); setType('email');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Interaction</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={4} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={logInteraction.isPending}>Log</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
