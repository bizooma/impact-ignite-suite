import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, CheckCircle, AlertCircle, Check, X } from 'lucide-react';
import { useCrmVolunteerHours } from '@/hooks/useCrmVolunteerHours';
import { useCrm } from '@/hooks/useCrm';
import { useOrgRole } from '@/hooks/useOrgRole';
import { useState, useMemo } from 'react';
import { VolunteerHoursFormDialog } from './VolunteerHoursFormDialog';
import { format } from 'date-fns';

interface Props { organizationId: string; }

export function VolunteerHoursManager({ organizationId }: Props) {
  const { hours, isLoading, setApproval } = useCrmVolunteerHours(organizationId);
  const { contacts } = useCrm(organizationId);
  const [showForm, setShowForm] = useState(false);

  const contactMap = useMemo(() => {
    const m = new Map<string, string>();
    contacts?.forEach(c => {
      const name = c.contact_type === 'organization'
        ? c.organization_name || 'Unnamed'
        : `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unnamed';
      m.set(c.id, name);
    });
    return m;
  }, [contacts]);

  const stats = useMemo(() => {
    if (!hours) return { thisMonth: 0, thisYear: 0, pending: 0 };
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    return {
      thisMonth: hours.filter(h => new Date(h.volunteer_date) >= monthStart).reduce((s, h) => s + Number(h.hours), 0),
      thisYear: hours.filter(h => new Date(h.volunteer_date) >= yearStart).reduce((s, h) => s + Number(h.hours), 0),
      pending: hours.filter(h => !h.approved).length,
    };
  }, [hours]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Clock} label="Hours this month" value={stats.thisMonth.toFixed(1)} />
        <StatCard icon={CheckCircle} label="Hours this year" value={stats.thisYear.toFixed(1)} />
        <StatCard icon={AlertCircle} label="Pending approval" value={stats.pending.toString()} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Volunteer Hours Log</CardTitle>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Log Hours
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : !hours || hours.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No volunteer hours logged yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hours.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{contactMap.get(h.contact_id) || 'Unknown'}</TableCell>
                    <TableCell>{h.activity}</TableCell>
                    <TableCell>{Number(h.hours).toFixed(1)}</TableCell>
                    <TableCell>{format(new Date(h.volunteer_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {h.approved ? <Badge>Approved</Badge> : <Badge variant="secondary">Pending</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {h.approved ? (
                        <Button size="sm" variant="ghost" onClick={() => setApproval.mutate({ id: h.id, approved: false })}>
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setApproval.mutate({ id: h.id, approved: true })}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <VolunteerHoursFormDialog open={showForm} onClose={() => setShowForm(false)} organizationId={organizationId} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
}
