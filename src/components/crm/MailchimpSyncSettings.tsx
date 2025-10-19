import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMailchimpSync } from '@/hooks/useMailchimpSync';
import { Plus, RefreshCw, Settings, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { MailchimpMappingDialog } from './MailchimpMappingDialog';
import type { CrmList } from '@/hooks/useCrm';

interface MailchimpSyncSettingsProps {
  organizationId: string;
  lists: CrmList[];
}

export const MailchimpSyncSettings = ({ organizationId, lists }: MailchimpSyncSettingsProps) => {
  const { mappings, loading, syncing, syncNow, deleteMapping, refetch } = useMailchimpSync(organizationId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<any>(null);

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Not Synced</Badge>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const handleEdit = (mapping: any) => {
    setEditingMapping(mapping);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMapping(null);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading Mailchimp sync settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Mailchimp Sync</h2>
          <p className="text-muted-foreground">
            Sync your CRM lists with Mailchimp audiences
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Mapping
        </Button>
      </div>

      {mappings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Mailchimp Mappings</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start syncing your CRM lists with Mailchimp audiences
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Mapping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {mappings.map((mapping) => (
            <Card key={mapping.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {mapping.crm_lists?.name || 'Unknown List'}
                      {mapping.sync_enabled && (
                        <Badge variant="outline" className="bg-primary/10">Active</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Syncing to Mailchimp audience: {mapping.mailchimp_audience_id}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(mapping)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncNow(mapping.id)}
                      disabled={syncing === mapping.id}
                    >
                      <RefreshCw className={`h-4 w-4 ${syncing === mapping.id ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this mapping?')) {
                          deleteMapping(mapping.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Sync Frequency</div>
                    <div className="text-sm capitalize">{mapping.sync_frequency}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Last Synced</div>
                    <div className="text-sm">{formatDate(mapping.last_synced_at)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(mapping.last_sync_status)}
                      {getStatusBadge(mapping.last_sync_status)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Options</div>
                    <div className="text-sm">
                      {mapping.sync_options?.sync_tags && <Badge variant="outline" className="mr-1">Tags</Badge>}
                      {mapping.sync_options?.double_optin && <Badge variant="outline">Double Opt-in</Badge>}
                    </div>
                  </div>
                </div>
                {mapping.last_sync_error && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm text-destructive">{mapping.last_sync_error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MailchimpMappingDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        organizationId={organizationId}
        lists={lists}
        mapping={editingMapping}
      />
    </div>
  );
};
