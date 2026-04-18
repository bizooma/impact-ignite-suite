import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, Users, Repeat, TrendingUp } from 'lucide-react';
import { useCrmDonations } from '@/hooks/useCrmDonations';
import { useCrm } from '@/hooks/useCrm';
import { useState, useMemo } from 'react';
import { DonationFormDialog } from './DonationFormDialog';
import { format } from 'date-fns';

interface Props { organizationId: string; }

export function DonationsManager({ organizationId }: Props) {
  const { donations, isLoading } = useCrmDonations(organizationId);
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
    if (!donations) return { total: 0, donorCount: 0, recurring: 0, avg: 0 };
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const thisYear = donations.filter(d => new Date(d.donation_date) >= yearStart);
    const total = thisYear.reduce((s, d) => s + Number(d.amount), 0);
    const donorIds = new Set(donations.map(d => d.contact_id));
    const recurring = donations.filter(d => d.is_recurring).length;
    const avg = thisYear.length ? total / thisYear.length : 0;
    return { total, donorCount: donorIds.size, recurring, avg };
  }, [donations]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Raised this year" value={`$${stats.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <StatCard icon={Users} label="Unique donors" value={stats.donorCount.toString()} />
        <StatCard icon={Repeat} label="Recurring gifts" value={stats.recurring.toString()} />
        <StatCard icon={TrendingUp} label="Avg gift (YTD)" value={`$${stats.avg.toFixed(0)}`} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Donations</CardTitle>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Record Donation
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : !donations || donations.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No donations recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{contactMap.get(d.contact_id) || 'Unknown'}</TableCell>
                    <TableCell>${Number(d.amount).toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(d.donation_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="capitalize">{(d.payment_method || '').replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      {d.is_recurring ? <Badge variant="secondary">Recurring</Badge> : <Badge variant="outline">One-time</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DonationFormDialog open={showForm} onClose={() => setShowForm(false)} organizationId={organizationId} />
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
