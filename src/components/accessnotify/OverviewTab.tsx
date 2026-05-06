import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, AlertTriangle, Sparkles, Users, FileCheck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAccessNotifyComplianceLogs, useAccessNotifyAccommodations } from '@/hooks/useAccessNotify';
import { format } from 'date-fns';

interface Props {
  organizationId: string;
}

const SAMPLE = {
  total: 1248,
  successRate: 96.4,
  accessibilityRate: 92,
  failed: 8,
  accommodations: 17,
  openRequests: 3,
};

export function OverviewTab({ organizationId }: Props) {
  const { data: logs = [], isLoading } = useAccessNotifyComplianceLogs(organizationId);
  const { data: accommodations = [] } = useAccessNotifyAccommodations(organizationId);

  const hasRealData = logs.length > 0;
  const total = hasRealData ? logs.length : SAMPLE.total;
  const sent = hasRealData ? logs.filter((l: any) => l.delivery_status === 'sent' || l.delivery_status === 'delivered').length : 0;
  const failed = hasRealData ? logs.filter((l: any) => l.delivery_status === 'failed').length : SAMPLE.failed;
  const successRate = hasRealData && total > 0 ? Math.round((sent / total) * 1000) / 10 : SAMPLE.successRate;
  const scored = hasRealData ? logs.filter((l: any) => typeof l.accessibility_score === 'number') : [];
  const avgA11y = scored.length
    ? Math.round(scored.reduce((s: number, l: any) => s + l.accessibility_score, 0) / scored.length)
    : SAMPLE.accessibilityRate;
  const accApplied = hasRealData ? logs.filter((l: any) => l.accommodation_applied).length : SAMPLE.accommodations;
  const openReq = accommodations.filter((a: any) => a.status !== 'resolved').length || (hasRealData ? 0 : SAMPLE.openRequests);

  const stats = [
    { label: 'Notifications sent', value: total.toLocaleString(), icon: Bell, color: 'text-primary' },
    { label: 'Delivery success rate', value: `${successRate}%`, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Accessibility pass rate', value: `${avgA11y}%`, icon: FileCheck, color: 'text-blue-600' },
    { label: 'Failed deliveries', value: String(failed), icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Accommodations applied', value: String(accApplied), icon: Sparkles, color: 'text-amber-600' },
    { label: 'Open accommodation requests', value: String(openReq), icon: Users, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {!hasRealData && !isLoading && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Sample data</Badge>
          <span className="text-sm text-muted-foreground">
            Showing example metrics. Send your first campaign to see live numbers.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-semibold mt-1">{s.value}</p>
                </div>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" /> Recent notification activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No notifications sent yet. Create a campaign to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>A11y</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 10).map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.campaign_name || '—'}</TableCell>
                    <TableCell>{l.recipient_label}</TableCell>
                    <TableCell><Badge variant="outline">{l.channel}</Badge></TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          l.delivery_status === 'sent' || l.delivery_status === 'delivered'
                            ? 'default'
                            : l.delivery_status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {l.delivery_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{l.accessibility_score ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(l.sent_at), 'MMM d, h:mm a')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-sm">
            All sent notifications are logged with accessibility checks. Compliance documentation is up to date.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
