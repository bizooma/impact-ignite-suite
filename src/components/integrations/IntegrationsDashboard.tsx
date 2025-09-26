import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Plug, Plus, Settings, Trash2, TestTube, CheckCircle, XCircle, Clock } from 'lucide-react';

interface IntegrationsDashboardProps {
  organizationId: string;
}

const IntegrationsDashboard: React.FC<IntegrationsDashboardProps> = ({ organizationId }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    config: '{}',
    encrypted_tokens: '{}',
  });

  const { integrations, loading, createIntegration, updateIntegration, deleteIntegration, testIntegration } = useIntegrations(organizationId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const integrationData = {
        ...formData,
        organization_id: organizationId,
        config: JSON.parse(formData.config),
        encrypted_tokens: JSON.parse(formData.encrypted_tokens),
        status: 'inactive',
      };

      if (editingIntegration) {
        await updateIntegration(editingIntegration.id, integrationData);
        setEditingIntegration(null);
      } else {
        await createIntegration(integrationData);
        setShowCreateDialog(false);
      }

      setFormData({ name: '', provider: '', config: '{}', encrypted_tokens: '{}' });
    } catch (error) {
      console.error('Error saving integration:', error);
    }
  };

  const handleEdit = (integration: any) => {
    setEditingIntegration(integration);
    setFormData({
      name: integration.name,
      provider: integration.provider,
      config: JSON.stringify(integration.config, null, 2),
      encrypted_tokens: JSON.stringify(integration.encrypted_tokens, null, 2),
    });
  };

  const handleTest = async (integration: any) => {
    try {
      await testIntegration(integration.id);
      await updateIntegration(integration.id, { status: 'active', last_synced_at: new Date().toISOString() });
    } catch (error) {
      await updateIntegration(integration.id, { status: 'error' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-warning text-warning-foreground';
    }
  };

  const availableProviders = [
    { value: 'google_ads', label: 'Google Ads' },
    { value: 'facebook_ads', label: 'Facebook Ads' },
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'google_analytics', label: 'Google Analytics' },
    { value: 'mailchimp', label: 'MailChimp' },
    { value: 'hubspot', label: 'HubSpot' },
    { value: 'salesforce', label: 'Salesforce' },
    { value: 'zapier', label: 'Zapier' },
    { value: 'slack', label: 'Slack' },
    { value: 'discord', label: 'Discord' },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted animate-pulse rounded" />
                  <div className="h-3 bg-muted animate-pulse rounded w-4/5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
          <p className="text-muted-foreground">
            Connect and manage third-party integrations
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Integration</DialogTitle>
              <DialogDescription>
                Connect a new third-party service to your platform
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Integration Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Google Ads Integration"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select value={formData.provider} onValueChange={(value) => setFormData({ ...formData, provider: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProviders.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="config">Configuration (JSON)</Label>
                <Textarea
                  id="config"
                  value={formData.config}
                  onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                  placeholder='{"api_endpoint": "https://api.example.com", "version": "v1"}'
                  className="min-h-[100px] font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="encrypted_tokens">API Keys/Tokens (JSON)</Label>
                <Textarea
                  id="encrypted_tokens"
                  value={formData.encrypted_tokens}
                  onChange={(e) => setFormData({ ...formData, encrypted_tokens: e.target.value })}
                  placeholder='{"api_key": "your_api_key", "secret": "your_secret"}'
                  className="min-h-[100px] font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  These will be encrypted and stored securely
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Integration
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {integrations.filter(i => i.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {integrations.filter(i => i.status === 'inactive').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {integrations.filter(i => i.status === 'error').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Plug className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-lg">{integration.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(integration.status)}
                  <Badge className={getStatusColor(integration.status)}>
                    {integration.status}
                  </Badge>
                </div>
              </div>
              <CardDescription>
                {availableProviders.find(p => p.value === integration.provider)?.label || integration.provider}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integration.last_synced_at && (
                <div className="text-sm text-muted-foreground">
                  Last synced: {new Date(integration.last_synced_at).toLocaleDateString()}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleTest(integration)}>
                  <TestTube className="h-4 w-4 mr-1" />
                  Test
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(integration)}>
                  <Settings className="h-4 w-4 mr-1" />
                  Configure
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => deleteIntegration(integration.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {integrations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plug className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No integrations yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connect your first third-party service to extend your platform capabilities
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Add Integration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingIntegration} onOpenChange={() => setEditingIntegration(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Integration</DialogTitle>
            <DialogDescription>
              Update your integration settings
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Integration Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-provider">Provider</Label>
                <Select value={formData.provider} onValueChange={(value) => setFormData({ ...formData, provider: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProviders.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-config">Configuration (JSON)</Label>
              <Textarea
                id="edit-config"
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                className="min-h-[100px] font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-encrypted_tokens">API Keys/Tokens (JSON)</Label>
              <Textarea
                id="edit-encrypted_tokens"
                value={formData.encrypted_tokens}
                onChange={(e) => setFormData({ ...formData, encrypted_tokens: e.target.value })}
                className="min-h-[100px] font-mono"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditingIntegration(null)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Integration
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationsDashboard;