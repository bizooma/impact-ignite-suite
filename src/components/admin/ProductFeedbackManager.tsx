import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Lightbulb, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface FeedbackRow {
  id: string;
  organization_id: string;
  user_id: string;
  type: 'feature_request' | 'feedback' | 'bug';
  title: string;
  description: string;
  status: 'new' | 'reviewing' | 'planned' | 'shipped' | 'declined';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  org_name?: string;
  submitter_email?: string;
}

const STATUS_VARIANTS: Record<FeedbackRow['status'], string> = {
  new: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  reviewing: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  planned: 'bg-purple-500/10 text-purple-700 border-purple-500/30',
  shipped: 'bg-green-500/10 text-green-700 border-green-500/30',
  declined: 'bg-muted text-muted-foreground border-border',
};

const TYPE_LABELS: Record<FeedbackRow['type'], string> = {
  feature_request: 'Feature Request',
  feedback: 'Feedback',
  bug: 'Bug',
};

export function ProductFeedbackManager() {
  const { logAdminAction } = usePlatformAdmin();
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selected, setSelected] = useState<FeedbackRow | null>(null);
  const [editStatus, setEditStatus] = useState<FeedbackRow['status']>('new');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: feedback, error } = await supabase
      .from('product_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load feedback error', error);
      toast.error('Failed to load feedback');
      setLoading(false);
      return;
    }

    const rows = (feedback || []) as FeedbackRow[];

    // Hydrate org names
    const orgIds = [...new Set(rows.map((r) => r.organization_id))];
    const userIds = [...new Set(rows.map((r) => r.user_id))];

    const [{ data: orgs }, { data: profiles }] = await Promise.all([
      orgIds.length
        ? supabase.from('organizations').select('id, name').in('id', orgIds)
        : Promise.resolve({ data: [] as any[] }),
      userIds.length
        ? supabase.from('profiles').select('user_id, display_name').in('user_id', userIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const orgMap = new Map((orgs || []).map((o: any) => [o.id, o.name]));
    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.user_id, p.display_name || p.user_id])
    );

    setItems(
      rows.map((r) => ({
        ...r,
        org_name: orgMap.get(r.organization_id) || '—',
        submitter_email: profileMap.get(r.user_id) || r.user_id.slice(0, 8),
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openItem = (row: FeedbackRow) => {
    setSelected(row);
    setEditStatus(row.status);
    setEditNotes(row.admin_notes || '');
  };

  const saveItem = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from('product_feedback')
      .update({ status: editStatus, admin_notes: editNotes || null })
      .eq('id', selected.id);
    setSaving(false);

    if (error) {
      toast.error('Failed to update feedback');
      return;
    }

    await logAdminAction('update_product_feedback', 'product_feedback', selected.id, {
      status: editStatus,
    });
    toast.success('Feedback updated');
    setSelected(null);
    load();
  };

  const filtered = items.filter((i) => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (typeFilter !== 'all' && i.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Product Feedback & Wishlist
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Submissions from organization members across the platform.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No feedback submissions yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Org</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id} className="cursor-pointer" onClick={() => openItem(row)}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(row.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm">{row.org_name}</TableCell>
                    <TableCell className="text-sm">{row.submitter_email}</TableCell>
                    <TableCell className="text-sm">{TYPE_LABELS[row.type]}</TableCell>
                    <TableCell className="text-sm font-medium max-w-xs truncate">{row.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_VARIANTS[row.status]}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openItem(row); }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Org:</span> {selected.org_name}</div>
                <div><span className="text-muted-foreground">Submitter:</span> {selected.submitter_email}</div>
                <div><span className="text-muted-foreground">Type:</span> {TYPE_LABELS[selected.type]}</div>
                <div><span className="text-muted-foreground">Submitted:</span> {format(new Date(selected.created_at), 'PPp')}</div>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <div className="mt-1 p-3 rounded-md bg-muted text-sm whitespace-pre-wrap">
                  {selected.description}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as FeedbackRow['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admin notes (internal)</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="Internal notes for the team…"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={saveItem} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
