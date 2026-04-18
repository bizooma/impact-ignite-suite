import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StripeStatus {
  connected: boolean;
  status?: string;
  secret_key_preview?: string | null;
  publishable_key?: string | null;
  webhook_secret_set?: boolean;
  livemode?: boolean | null;
  account_id?: string | null;
  account_email?: string | null;
  last_verified_at?: string | null;
}

interface Props {
  organizationId: string;
}

export function StripeConnectSettings({ organizationId }: Props) {
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [publishableKey, setPublishableKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('stripe-connect-settings', {
      body: { action: 'status', organization_id: organizationId },
    });
    setLoading(false);
    if (error) {
      toast.error('Failed to load Stripe status');
      return;
    }
    setStatus(data);
    if (data?.publishable_key) setPublishableKey(data.publishable_key);
  };

  useEffect(() => {
    load();
  }, [organizationId]);

  const handleTest = async () => {
    if (!secretKey) {
      toast.error('Enter a secret key first');
      return;
    }
    setTesting(true);
    const { data, error } = await supabase.functions.invoke('stripe-connect-settings', {
      body: { action: 'test', organization_id: organizationId, secret_key: secretKey },
    });
    setTesting(false);
    if (error || !data?.ok) {
      toast.error(data?.error || 'Stripe test failed');
      return;
    }
    toast.success(`Connected to Stripe account ${data.account?.id} ${data.account?.livemode ? '(LIVE)' : '(test mode)'}`);
  };

  const handleSave = async () => {
    if (!secretKey) {
      toast.error('Enter a secret key first');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('stripe-connect-settings', {
      body: {
        action: 'save',
        organization_id: organizationId,
        secret_key: secretKey,
        publishable_key: publishableKey || undefined,
        webhook_secret: webhookSecret || undefined,
      },
    });
    setSaving(false);
    if (error || !data?.ok) {
      toast.error(data?.error || error?.message || 'Failed to save');
      return;
    }
    toast.success('Stripe connected');
    setSecretKey('');
    setWebhookSecret('');
    setShowForm(false);
    load();
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Stripe? Donation auto-sync will stop until reconnected.')) return;
    const { error } = await supabase.functions.invoke('stripe-connect-settings', {
      body: { action: 'delete', organization_id: organizationId },
    });
    if (error) {
      toast.error('Failed to disconnect');
      return;
    }
    toast.success('Stripe disconnected');
    setSecretKey('');
    setPublishableKey('');
    setWebhookSecret('');
    load();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              Stripe Connection
              {status?.connected ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline">Not connected</Badge>
              )}
              {status?.connected && status?.livemode === false && (
                <Badge variant="secondary">Test mode</Badge>
              )}
              {status?.connected && status?.livemode === true && (
                <Badge variant="destructive">Live mode</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Connect your organization's Stripe account so donations made through Stripe automatically sync into your CRM.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status?.connected && !showForm && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Account</div>
                <div className="font-mono">{status.account_id}</div>
              </div>
              {status.account_email && (
                <div>
                  <div className="text-muted-foreground text-xs">Email</div>
                  <div>{status.account_email}</div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground text-xs">Secret Key</div>
                <div className="font-mono">{status.secret_key_preview}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Webhook Signing Secret</div>
                <div>{status.webhook_secret_set ? '✓ Set' : <span className="text-muted-foreground">Not set</span>}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                Update credentials
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-1" /> Disconnect
              </Button>
            </div>
          </div>
        )}

        {(!status?.connected || showForm) && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Get your keys from{' '}
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noreferrer"
                  className="underline inline-flex items-center gap-1"
                >
                  Stripe Dashboard → Developers → API keys <ExternalLink className="h-3 w-3" />
                </a>
                . Use a <strong>restricted key</strong> with read access to charges, payment intents, customers, and subscriptions for best security.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="sk">
                Secret Key <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="sk"
                  type={showSecret ? 'text' : 'password'}
                  placeholder="sk_live_... or sk_test_..."
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value.trim())}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Stored encrypted. Only org admins can view or modify.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pk">Publishable Key (optional)</Label>
              <Input
                id="pk"
                placeholder="pk_live_... or pk_test_..."
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value.trim())}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ws">Webhook Signing Secret (optional)</Label>
              <Input
                id="ws"
                type="password"
                placeholder="whsec_..."
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value.trim())}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Required if you want to enable webhook-based donation sync. Find it in Stripe → Developers → Webhooks after creating an endpoint.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleTest} disabled={testing || !secretKey}>
                {testing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Test connection
              </Button>
              <Button onClick={handleSave} disabled={saving || !secretKey}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Save & connect
              </Button>
              {showForm && status?.connected && (
                <Button variant="ghost" onClick={() => { setShowForm(false); setSecretKey(''); setWebhookSecret(''); }}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
