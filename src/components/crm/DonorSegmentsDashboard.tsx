import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCrmDonorAnalytics, type DonorSegmentKey } from '@/hooks/useCrmDonorAnalytics';
import { useCrm } from '@/hooks/useCrm';
import { Crown, Repeat, TrendingDown, AlertTriangle, Sparkles, Moon, Users, Download } from 'lucide-react';
import { toast } from 'sonner';

const SEGMENT_ICONS: Record<DonorSegmentKey, any> = {
  major: Crown,
  sustaining: Repeat,
  lybunt: TrendingDown,
  sybunt: AlertTriangle,
  new_this_year: Sparkles,
  lapsed: Moon,
};

interface Props { organizationId: string; }

export function DonorSegmentsDashboard({ organizationId }: Props) {
  const { segments, retentionRate, retentionDetails, isLoading, contactById } =
    useCrmDonorAnalytics(organizationId);
  const { lists, addContactToList } = useCrm(organizationId);
  const [openKey, setOpenKey] = useState<DonorSegmentKey | null>(null);
  const [bulkListId, setBulkListId] = useState<string>('');
  const [adding, setAdding] = useState(false);

  const openSegment = openKey ? segments[openKey] : null;

  const getName = (id: string) => {
    const c = contactById.get(id);
    if (!c) return 'Unknown';
    if (c.contact_type === 'organization') return c.organization_name || 'Unnamed';
    return `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || 'Unnamed';
  };

  const handleBulkAdd = async () => {
    if (!openSegment || !bulkListId) return;
    setAdding(true);
    try {
      for (const cid of openSegment.contactIds) {
        await addContactToList.mutateAsync({ listId: bulkListId, contactId: cid }).catch(() => {});
      }
      toast.success(`Added ${openSegment.contactIds.length} contacts to list`);
      setBulkListId('');
    } finally {
      setAdding(false);
    }
  };

  const exportCsv = () => {
    if (!openSegment) return;
    const rows = [['Name', 'Email', 'Lifecycle stage']];
    openSegment.contactIds.forEach((id) => {
      const c = contactById.get(id);
      rows.push([getName(id), c?.email || '', c?.lifecycle_stage || '']);
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${openSegment.key}-donors.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Donor Retention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-bold">{retentionRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">
                {retentionDetails.retainedDonors} of {retentionDetails.lastYearDonors} last-year donors gave again
              </p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <Progress value={retentionRate} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.keys(segments) as DonorSegmentKey[]).map((key) => {
          const seg = segments[key];
          const Icon = SEGMENT_ICONS[key];
          return (
            <Card key={key} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{seg.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{seg.contactIds.length}</div>
                <p className="text-xs text-muted-foreground mb-3">{seg.description}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={seg.contactIds.length === 0 || isLoading}
                  onClick={() => setOpenKey(key)}
                >
                  View list
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Sheet open={!!openKey} onOpenChange={(o) => !o && setOpenKey(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {openSegment && (
            <>
              <SheetHeader>
                <SheetTitle>{openSegment.label}</SheetTitle>
                <SheetDescription>{openSegment.description}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{openSegment.contactIds.length} contacts</Badge>
                  <Button size="sm" variant="outline" onClick={exportCsv}>
                    <Download className="h-3 w-3 mr-1" /> Export CSV
                  </Button>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Bulk add to list</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Select value={bulkListId} onValueChange={setBulkListId}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Choose a list..." /></SelectTrigger>
                      <SelectContent>
                        {lists?.map((l) => (
                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleBulkAdd} disabled={!bulkListId || adding}>
                      {adding ? 'Adding...' : 'Add all'}
                    </Button>
                  </CardContent>
                </Card>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Stage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openSegment.contactIds.map((id) => {
                      const c = contactById.get(id);
                      return (
                        <TableRow key={id}>
                          <TableCell className="font-medium">{getName(id)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c?.email || '—'}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{c?.lifecycle_stage || '—'}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
