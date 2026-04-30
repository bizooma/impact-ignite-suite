import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { z } from 'zod';
import { useCrmDonations } from '@/hooks/useCrmDonations';
import { useCrm } from '@/hooks/useCrm';
import { useToast } from '@/components/ui/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  contactId?: string; // pre-fill if recording from contact profile
}

// Donations must be a positive monetary value. Cap at 10M to catch typos /
// abuse before they reach analytics + donor segments.
const donationAmountSchema = z
  .number({ invalid_type_error: 'Amount must be a number' })
  .finite('Amount must be a valid number')
  .gt(0, 'Amount must be greater than zero')
  .max(10_000_000, 'Amount is unrealistically large');

export function DonationFormDialog({ open, onClose, organizationId, contactId }: Props) {
  const { createDonation } = useCrmDonations(organizationId);
  const { contacts } = useCrm(organizationId);
  const { toast } = useToast();
  const [selectedContactId, setSelectedContactId] = useState(contactId || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cid = contactId || selectedContactId;
    if (!cid) return;

    const parsedAmount = parseFloat(amount);
    const result = donationAmountSchema.safeParse(parsedAmount);
    if (!result.success) {
      toast({
        title: 'Invalid amount',
        description: result.error.issues[0]?.message ?? 'Please enter a positive donation amount.',
        variant: 'destructive',
      });
      return;
    }

    await createDonation.mutateAsync({
      contact_id: cid,
      amount: result.data,
      donation_date: date,
      payment_method: paymentMethod,
      is_recurring: isRecurring,
      notes,
      currency: 'USD',
    });
    setAmount(''); setNotes(''); setIsRecurring(false);
    onClose();
  };

  const getName = (c: any) => c.contact_type === 'organization'
    ? c.organization_name
    : `${c.first_name || ''} ${c.last_name || ''}`.trim();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Donation</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!contactId && (
            <div>
              <Label>Contact</Label>
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
            <Label>Amount (USD)</Label>
            <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="recurring" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
            <Label htmlFor="recurring">Recurring donation</Label>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createDonation.isPending}>Record</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
