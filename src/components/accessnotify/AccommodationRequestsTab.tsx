import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccessNotifyAccommodations } from '@/hooks/useAccessNotify';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const STATUSES = ['new', 'in_review', 'resolved'] as const;

export function AccommodationRequestsTab({ organizationId }: { organizationId: string }) {
  const { data: requests = [], isLoading } = useAccessNotifyAccommodations(organizationId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [accommodation, setAccommodation] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const qc = useQueryClient();

  const create = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from('accessnotify_accommodation_requests').insert({
      organization_id: organizationId,
      contact_name: name,
      request_type: type,
      preferred_accommodation: accommodation,
      notes,
    });
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Request created' });
    setName(''); setType(''); setAccommodation(''); setNotes('');
    setOpen(false);
    qc.invalidateQueries({ queryKey: ['accessnotify-accommodations', organizationId] });
  };

  const updateStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === 'resolved') patch.resolved_at = new Date().toISOString();
    const { error } = await supabase.from('accessnotify_accommodation_requests').update(patch).eq('id', id);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    qc.invalidateQueries({ queryKey: ['accessnotify-accommodations', organizationId] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Accommodation requests</h2>
          <p className="text-sm text-muted-foreground">Track accessibility-related communication requests.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />New request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New accommodation request</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Contact name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Request type</Label><Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Large print, Voice-only…" /></div>
              <div><Label>Preferred accommodation</Label><Input value={accommodation} onChange={(e) => setAccommodation(e.target.value)} /></div>
              <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            </div>
            <DialogFooter><Button onClick={create}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {STATUSES.map((s) => {
          const items = requests.filter((r: any) => r.status === s);
          return (
            <div key={s}>
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide flex items-center gap-2">
                {s.replace('_', ' ')}
                <Badge variant="secondary">{items.length}</Badge>
              </h3>
              <div className="space-y-2">
                {isLoading ? <p className="text-muted-foreground text-sm">Loading…</p> : items.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center border rounded-md">None</p>
                ) : items.map((r: any) => (
                  <Card key={r.id}>
                    <CardContent className="p-4 space-y-2">
                      <p className="font-medium">{r.contact_name}</p>
                      {r.request_type && <p className="text-xs text-muted-foreground">{r.request_type}</p>}
                      {r.preferred_accommodation && <p className="text-sm">{r.preferred_accommodation}</p>}
                      {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                      <p className="text-xs text-muted-foreground">{format(new Date(r.received_at), 'MMM d, yyyy')}</p>
                      <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((st) => <SelectItem key={st} value={st}>{st.replace('_', ' ')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
