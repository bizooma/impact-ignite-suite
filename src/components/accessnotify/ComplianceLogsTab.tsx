import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { useAccessNotifyComplianceLogs } from '@/hooks/useAccessNotify';
import { format } from 'date-fns';

export function ComplianceLogsTab({ organizationId }: { organizationId: string }) {
  const { data: logs = [], isLoading } = useAccessNotifyComplianceLogs(organizationId);
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('all');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    return logs.filter((l: any) => {
      if (channel !== 'all' && l.channel !== channel) return false;
      if (status !== 'all' && l.delivery_status !== status) return false;
      if (search && !`${l.campaign_name} ${l.recipient_label}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [logs, channel, status, search]);

  const exportCsv = () => {
    const headers = ['campaign_name', 'recipient_label', 'channel', 'delivery_status', 'accessibility_score', 'sent_at'];
    const rows = filtered.map((l: any) => headers.map((h) => JSON.stringify(l[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `accessnotify-compliance-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Compliance logs</h2>
          <p className="text-sm text-muted-foreground">Every notification sent is logged for ADA documentation.</p>
        </div>
        <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="voice">Voice</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-center text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-12 text-center text-muted-foreground">No log entries match your filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sent</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>A11y</TableHead>
                  <TableHead>Version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-muted-foreground">{format(new Date(l.sent_at), 'MMM d, h:mm a')}</TableCell>
                    <TableCell className="font-medium">{l.campaign_name || '—'}</TableCell>
                    <TableCell>{l.recipient_label}</TableCell>
                    <TableCell><Badge variant="outline">{l.channel}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={l.delivery_status === 'failed' ? 'destructive' : 'default'}>
                        {l.delivery_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{l.accessibility_score ?? '—'}</TableCell>
                    <TableCell>{l.version_sent ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
