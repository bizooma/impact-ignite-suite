import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props { organizationId: string }

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  image_url: string | null;
  capacity: number | null;
  is_published: boolean;
}

const empty: Partial<EventRow> = {
  title: '', description: '', location: '', starts_at: '', ends_at: '',
  image_url: '', capacity: null, is_published: false,
};

export function EventsManager({ organizationId }: Props) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<EventRow> | null>(null);
  const [rsvpEvent, setRsvpEvent] = useState<EventRow | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['org-events', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_events')
        .select('*')
        .eq('organization_id', organizationId)
        .order('starts_at', { ascending: false });
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const save = useMutation({
    mutationFn: async (e: Partial<EventRow>) => {
      const payload: any = {
        organization_id: organizationId,
        title: e.title,
        description: e.description || null,
        location: e.location || null,
        starts_at: e.starts_at,
        ends_at: e.ends_at || null,
        image_url: e.image_url || null,
        capacity: e.capacity ? Number(e.capacity) : null,
        is_published: !!e.is_published,
      };
      if (e.id) {
        const { error } = await supabase.from('org_events').update(payload).eq('id', e.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('org_events').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-events', organizationId] });
      toast.success('Event saved');
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('org_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-events', organizationId] });
      toast.success('Event deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Events</CardTitle>
        <Button onClick={() => { setEditing({ ...empty }); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Event
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : events && events.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Starts</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell>{format(new Date(e.starts_at), 'PP p')}</TableCell>
                  <TableCell>{e.location || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={e.is_published ? 'default' : 'secondary'}>
                      {e.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => setRsvpEvent(e)}><Users className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(e); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this event?')) remove.mutate(e.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No events yet. Create your first one.</div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Starts at *</Label>
                  <Input type="datetime-local" value={editing.starts_at?.slice(0, 16) || ''} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })} />
                </div>
                <div>
                  <Label>Ends at</Label>
                  <Input type="datetime-local" value={editing.ends_at?.slice(0, 16) || ''} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <Input value={editing.location || ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input type="number" value={editing.capacity ?? ''} onChange={(e) => setEditing({ ...editing, capacity: e.target.value ? Number(e.target.value) : null })} />
                </div>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={editing.image_url || ''} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!editing.is_published} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
                <Label>Published (visible in mobile app)</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => editing && save.mutate(editing)} disabled={!editing?.title || !editing?.starts_at || save.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RsvpDialog event={rsvpEvent} onClose={() => setRsvpEvent(null)} />
    </Card>
  );
}

function RsvpDialog({ event, onClose }: { event: EventRow | null; onClose: () => void }) {
  const { data: rsvps } = useQuery({
    queryKey: ['event-rsvps', event?.id],
    queryFn: async () => {
      if (!event) return [];
      const { data, error } = await supabase
        .from('org_event_rsvps')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!event,
  });

  return (
    <Dialog open={!!event} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>RSVPs — {event?.title}</DialogTitle>
        </DialogHeader>
        {rsvps && rsvps.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rsvps.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.phone || '—'}</TableCell>
                  <TableCell>{r.guests}</TableCell>
                  <TableCell>{format(new Date(r.created_at), 'PP p')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No RSVPs yet.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
