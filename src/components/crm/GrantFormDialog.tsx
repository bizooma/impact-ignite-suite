import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCrmGrants, GRANT_STAGES, type CrmGrant, type GrantStage } from '@/hooks/useCrmGrants';
import { useCrm } from '@/hooks/useCrm';
import { useToast } from '@/components/ui/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  grant?: CrmGrant | null;
  defaultStage?: GrantStage;
}

// Grant amounts are optional but, when present, must be non-negative and finite.
const grantAmountSchema = z
  .number({ message: 'Amount must be a number' })
  .finite('Amount must be a valid number')
  .gte(0, 'Amount cannot be negative')
  .max(1_000_000_000, 'Amount is unrealistically large');

type AmountResult = { ok: true; value: number | null } | { ok: false; message: string };
const parseOptionalAmount = (raw: unknown): AmountResult => {
  if (raw === null || raw === undefined || raw === '') return { ok: true, value: null };
  const n = typeof raw === 'number' ? raw : Number(raw);
  const result = grantAmountSchema.safeParse(n);
  if (!result.success) {
    return { ok: false, message: result.error.issues[0]?.message ?? 'Invalid amount' };
  }
  return { ok: true, value: result.data };
};

export function GrantFormDialog({ open, onClose, organizationId, grant, defaultStage }: Props) {
  const { createGrant, updateGrant } = useCrmGrants(organizationId);
  const { contacts } = useCrm(organizationId);
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<CrmGrant>>({});

  useEffect(() => {
    if (open) {
      setForm(grant ?? { stage: defaultStage ?? 'researching' });
    }
  }, [open, grant, defaultStage]);

  const set = (k: keyof CrmGrant, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.foundation_name || !form.grant_name) return;

    const requested: AmountResult = parseOptionalAmount(form.amount_requested);
    if (!requested.ok) {
      toast({ title: 'Invalid amount requested', description: requested.message, variant: 'destructive' });
      return;
    }
    const awarded: AmountResult = parseOptionalAmount(form.amount_awarded);
    if (!awarded.ok) {
      toast({ title: 'Invalid amount awarded', description: awarded.message, variant: 'destructive' });
      return;
    }

    const payload = {
      ...form,
      amount_requested: requested.value,
      amount_awarded: awarded.value,
      contact_id: form.contact_id || null,
      deadline: form.deadline || null,
      submitted_date: form.submitted_date || null,
      decision_date: form.decision_date || null,
    };
    if (grant) {
      await updateGrant.mutateAsync({ id: grant.id, updates: payload });
    } else {
      await createGrant.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{grant ? 'Edit Grant' : 'New Grant'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Foundation *</Label>
            <Input value={form.foundation_name || ''} onChange={(e) => set('foundation_name', e.target.value)} />
          </div>
          <div>
            <Label>Grant name *</Label>
            <Input value={form.grant_name || ''} onChange={(e) => set('grant_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount requested</Label>
              <Input type="number" value={form.amount_requested ?? ''} onChange={(e) => set('amount_requested', e.target.value)} />
            </div>
            <div>
              <Label>Amount awarded</Label>
              <Input type="number" value={form.amount_awarded ?? ''} onChange={(e) => set('amount_awarded', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Stage</Label>
              <Select value={form.stage || 'researching'} onValueChange={(v) => set('stage', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRANT_STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Deadline</Label>
              <Input type="date" value={form.deadline || ''} onChange={(e) => set('deadline', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Submitted</Label>
              <Input type="date" value={form.submitted_date || ''} onChange={(e) => set('submitted_date', e.target.value)} />
            </div>
            <div>
              <Label>Decision</Label>
              <Input type="date" value={form.decision_date || ''} onChange={(e) => set('decision_date', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Program officer (contact)</Label>
            <Select value={form.contact_id || 'none'} onValueChange={(v) => set('contact_id', v === 'none' ? null : v)}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {contacts?.map((c) => {
                  const name = c.contact_type === 'organization'
                    ? c.organization_name || 'Unnamed'
                    : `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || 'Unnamed';
                  return <SelectItem key={c.id} value={c.id}>{name}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.foundation_name || !form.grant_name}>
            {grant ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
