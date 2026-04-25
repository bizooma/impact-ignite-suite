import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useTierLimits } from '@/hooks/useTierLimits';
import { formatCap } from '@/lib/aiTierLimits';
import { Facebook, CheckCircle, XCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Integration } from '@/types/database';

interface SocialIntegrationsPanelProps {
  organizationId: string;
}

const SocialIntegrationsPanel: React.FC<SocialIntegrationsPanelProps> = ({ organizationId }) => {
  const { integrations, loading, deleteIntegration, refetch } = useIntegrations(organizationId);
  const { canCreate, limits, counts, tier } = useTierLimits(organizationId);
  const [connecting, setConnecting] = useState(false);
  const [pendingDisconnect, setPendingDisconnect] = useState<Integration | null>(null);

  // All connected Facebook Pages for this org (one row per Page)
  const facebookIntegrations = integrations.filter(
    (i) => i.provider === 'facebook' && i.status === 'active'
  );

  const startFacebookConnect = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('facebook-oauth-start', {
        body: {
          organization_id: organizationId,
          return_to: '/dashboard/social',
        },
      });
      if (error) throw error;
      if (!data?.authorize_url) throw new Error('No authorize URL returned');
      // Send the user to Facebook
      window.location.href = data.authorize_url;
    } catch (err: any) {
      console.error('[SocialIntegrationsPanel] connect failed', err);
      toast.error('Could not start Facebook connection', {
        description: err?.message ?? 'Unexpected error',
      });
      setConnecting(false);
    }
  };

  const confirmDisconnect = async () => {
    if (!pendingDisconnect) return;
    try {
      await deleteIntegration(pendingDisconnect.id);
      toast.success('Facebook Page disconnected');
      setPendingDisconnect(null);
      refetch();
    } catch (err: any) {
      toast.error('Could not disconnect', { description: err?.message });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted animate-pulse rounded w-1/3" />
          <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAnyConnected = facebookIntegrations.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Social Media Connections</CardTitle>
          <CardDescription>
            Connect your social media accounts to publish directly from the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasAnyConnected && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to connect at least one Facebook Page to publish posts. Click "Connect Facebook" below to get started.
              </AlertDescription>
            </Alert>
          )}

          {/* Connected Pages */}
          {facebookIntegrations.map((integration) => {
            const cfg = (integration.config ?? {}) as Record<string, any>;
            return (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {cfg.picture_url ? (
                    <img
                      src={cfg.picture_url}
                      alt={cfg.page_name ?? 'Facebook Page'}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="text-[#1877F2]">
                      <Facebook className="h-8 w-8" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{cfg.page_name ?? 'Facebook Page'}</h4>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {cfg.category ?? 'Facebook Page'}
                      {cfg.connected_at && (
                        <> · Connected {new Date(cfg.connected_at).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingDisconnect(integration)}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Connect / add another */}
          <div className="flex items-center justify-between p-4 border-2 border-dashed rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-[#1877F2]">
                <Facebook className="h-8 w-8" />
              </div>
              <div>
                <h4 className="font-medium">
                  {hasAnyConnected ? 'Connect another Facebook Page' : 'Connect Facebook'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Authorize Causeio to publish posts to a Facebook Page you manage
                </p>
              </div>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      onClick={startFacebookConnect}
                      className="gap-2"
                      disabled={!canCreate.socialAccount || connecting}
                    >
                      {connecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Redirecting…
                        </>
                      ) : (
                        <>
                          {hasAnyConnected ? 'Add Page' : 'Connect Facebook'}
                          <ExternalLink className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canCreate.socialAccount && (
                  <TooltipContent>
                    <p>
                      You've connected {counts.socialAccounts}/{formatCap(limits.socialAccounts)} social accounts on the {tier} plan.
                    </p>
                    <Link to="/pricing" className="underline">Upgrade to add more</Link>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Coming soon platforms */}
          <div className="pt-4 border-t space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Coming soon</p>
            <div className="flex flex-wrap gap-2">
              {['Instagram', 'LinkedIn', 'Twitter / X'].map((name) => (
                <Badge key={name} variant="outline" className="bg-muted text-muted-foreground">
                  <XCircle className="h-3 w-3 mr-1" />
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingDisconnect} onOpenChange={(o) => !o && setPendingDisconnect(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Facebook Page?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDisconnect && (
                <>
                  This will remove access to{' '}
                  <span className="font-medium">
                    {(pendingDisconnect.config as any)?.page_name ?? 'this Page'}
                  </span>
                  . Scheduled posts targeting this Page will fail until you reconnect.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisconnect}>Disconnect</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SocialIntegrationsPanel;
