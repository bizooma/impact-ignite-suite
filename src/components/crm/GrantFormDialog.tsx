import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCrmGrants, GRANT_STAGES, type CrmGrant, type GrantStage } from '@/hooks/useCrmGrants';
import { useCrm } from '@/hooks/useCrm';

interface Props {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  grant?: CrmGrant | null;
  defaultStage?: GrantStage;
}

export function GrantFormDialog({ open, onClose, organizationId, grant, defaultStage }: Props) {
  const { createGrant, updateGrant } = useCrmGrants(organizationId);
  const { contacts } = useCrm(organizationId);
  const [form, setForm] = useState<Partial<CrmGrant>>({});

  useEffect(() => {
    if (open) {
      setForm(grant ?? { stage: defaultStage ?? 'researching' });
    }
  }, [open, grant, defaultStage]);

  const set = (k: keyof CrmGrant, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.foundation_name || !form.grant_name) return;
    const payload = {
      ...form,
      amount_requested: form.amount_requested ? Number(form.amount_requested) : null,
      amount_awarded: form.amount_awarded ? Number(form.amount_awarded) : null,
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
