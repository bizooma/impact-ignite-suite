import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, MessageSquare, Phone } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAccessNotifyCampaigns } from '@/hooks/useAccessNotify';
import { CampaignBuilderDialog } from './CampaignBuilderDialog';
import { format } from 'date-fns';

export function CampaignsTab({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false);
  const { data: campaigns = [], isLoading } = useAccessNotifyCampaigns(organizationId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Campaigns</h2>
          <p className="text-sm text-muted-foreground">Build and send accessible notification campaigns.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />New campaign</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-center text-muted-foreground">Loading…</p>
          ) : campaigns.length === 0 ? (
            <p className="p-12 text-center text-muted-foreground">No campaigns yet. Create your first one.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="capitalize">{c.type.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {c.channels?.includes('email') && <Mail className="w-4 h-4 text-muted-foreground" />}
                        {c.channels?.includes('sms') && <MessageSquare className="w-4 h-4 text-muted-foreground" />}
                        {c.channels?.includes('voice') && <Phone className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={c.status === 'sent' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(c.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CampaignBuilderDialog open={open} onOpenChange={setOpen} organizationId={organizationId} />
    </div>
  );
}
