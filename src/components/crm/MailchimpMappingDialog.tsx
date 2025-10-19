import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMailchimpSync } from '@/hooks/useMailchimpSync';
import { useIntegrations } from '@/hooks/useIntegrations';
import type { CrmList } from '@/hooks/useCrm';
import { Loader2 } from 'lucide-react';

interface MailchimpMappingDialogProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  lists: CrmList[];
  mapping?: any;
}

export const MailchimpMappingDialog = ({
  open,
  onClose,
  organizationId,
  lists,
  mapping,
}: MailchimpMappingDialogProps) => {
  const { integrations } = useIntegrations(organizationId);
  const { audiences, testConnection, createMapping, updateMapping } = useMailchimpSync(organizationId);
  
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [formData, setFormData] = useState({
    crm_list_id: mapping?.crm_list_id || '',
    mailchimp_audience_id: mapping?.mailchimp_audience_id || '',
    sync_enabled: mapping?.sync_enabled || false,
    sync_frequency: mapping?.sync_frequency || 'manual',
    sync_options: mapping?.sync_options || {
      double_optin: false,
      update_existing: true,
      archive_on_removal: false,
      sync_tags: true,
      sync_direction: 'one_way',
    },
  });

  const mailchimpIntegration = integrations.find(i => i.provider === 'mailchimp' && i.status === 'active');

  useEffect(() => {
    if (mapping) {
      setFormData({
        crm_list_id: mapping.crm_list_id,
        mailchimp_audience_id: mapping.mailchimp_audience_id,
        sync_enabled: mapping.sync_enabled,
        sync_frequency: mapping.sync_frequency,
        sync_options: mapping.sync_options || {
          double_optin: false,
          update_existing: true,
          archive_on_removal: false,
          sync_tags: true,
          sync_direction: 'one_way',
        },
      });
    }
  }, [mapping]);

  useEffect(() => {
    if (open && mailchimpIntegration && audiences.length === 0) {
      handleTestConnection();
    }
  }, [open, mailchimpIntegration]);

  const handleTestConnection = async () => {
    if (!mailchimpIntegration?.encrypted_tokens?.api_key) {
      return;
    }

    setTestingConnection(true);
    await testConnection(mailchimpIntegration.encrypted_tokens.api_key);
    setTestingConnection(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mapping) {
        await updateMapping(mapping.id, formData);
      } else {
        await createMapping(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving mapping:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mailchimpIntegration) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mailchimp Integration Required</DialogTitle>
            <DialogDescription>
              Please add a Mailchimp integration first in the Integrations dashboard.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mapping ? 'Edit' : 'Create'} Mailchimp Mapping</DialogTitle>
          <DialogDescription>
            Configure how your CRM list syncs with Mailchimp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>CRM List</Label>
            <Select
              value={formData.crm_list_id}
              onValueChange={(value) => setFormData({ ...formData, crm_list_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a CRM list" />
              </SelectTrigger>
              <SelectContent>
                {lists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name} ({list.contact_count} contacts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Mailchimp Audience</Label>
              {testingConnection ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTestConnection}
                >
                  Refresh Audiences
                </Button>
              )}
            </div>
            <Select
              value={formData.mailchimp_audience_id}
              onValueChange={(value) => setFormData({ ...formData, mailchimp_audience_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a Mailchimp audience" />
              </SelectTrigger>
              <SelectContent>
                {audiences.map((audience) => (
                  <SelectItem key={audience.id} value={audience.id}>
                    {audience.name} ({audience.member_count} members)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sync Frequency</Label>
            <Select
              value={formData.sync_frequency}
              onValueChange={(value: any) => setFormData({ ...formData, sync_frequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Only</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Sync Options</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Sync</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically sync contacts based on frequency
                </div>
              </div>
              <Switch
                checked={formData.sync_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, sync_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Double Opt-in</Label>
                <div className="text-sm text-muted-foreground">
                  Require email confirmation in Mailchimp
                </div>
              </div>
              <Switch
                checked={formData.sync_options.double_optin}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    sync_options: { ...formData.sync_options, double_optin: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Update Existing Subscribers</Label>
                <div className="text-sm text-muted-foreground">
                  Update contact info if already subscribed
                </div>
              </div>
              <Switch
                checked={formData.sync_options.update_existing}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    sync_options: { ...formData.sync_options, update_existing: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sync Tags</Label>
                <div className="text-sm text-muted-foreground">
                  Push CRM tags to Mailchimp tags
                </div>
              </div>
              <Switch
                checked={formData.sync_options.sync_tags}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    sync_options: { ...formData.sync_options, sync_tags: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Archive on Removal</Label>
                <div className="text-sm text-muted-foreground">
                  Archive in Mailchimp when removed from CRM list
                </div>
              </div>
              <Switch
                checked={formData.sync_options.archive_on_removal}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    sync_options: { ...formData.sync_options, archive_on_removal: checked },
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.crm_list_id || !formData.mailchimp_audience_id}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mapping ? 'Update' : 'Create'} Mapping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
