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
import { Facebook, Linkedin, CheckCircle, XCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Integration } from '@/types/database';

interface SocialIntegrationsPanelProps {
  organizationId: string;
}

const SocialIntegrationsPanel: React.FC<SocialIntegrationsPanelProps> = ({ organizationId }) => {
  const { integrations, loading, deleteIntegration, refetch } = useIntegrations(organizationId);
  const { canCreate, limits, counts, tier } = useTierLimits(organizationId);
  const [connecting, setConnecting] = useState<null | 'facebook' | 'linkedin'>(null);
  const [pendingDisconnect, setPendingDisconnect] = useState<Integration | null>(null);

  const facebookIntegrations = integrations.filter(
    (i) => i.provider === 'facebook' && i.status === 'active'
  );
  const linkedinIntegrations = integrations.filter(
    (i) => i.provider === 'linkedin' && i.status === 'active'
  );

  const startConnect = async (
    provider: 'facebook' | 'linkedin',
  ) => {
    setConnecting(provider);
    try {
      const fnName = provider === 'facebook' ? 'facebook-oauth-start' : 'linkedin-oauth-start';
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: {
          organization_id: organizationId,
          return_to: '/dashboard/social',
        },
      });
      if (error) throw error;
      if (!data?.authorize_url) throw new Error('No authorize URL returned');
      window.location.href = data.authorize_url;
    } catch (err: any) {
      console.error(`[SocialIntegrationsPanel] ${provider} connect failed`, err);
      toast.error(`Could not start ${provider === 'facebook' ? 'Facebook' : 'LinkedIn'} connection`, {
        description: err?.message ?? 'Unexpected error',
      });
      setConnecting(null);
    }
  };

  const confirmDisconnect = async () => {
    if (!pendingDisconnect) return;
    const label = pendingDisconnect.provider === 'linkedin' ? 'LinkedIn Page' : 'Facebook Page';
    try {
      await deleteIntegration(pendingDisconnect.id);
      toast.success(`${label} disconnected`);
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

  const hasAnyConnected = facebookIntegrations.length > 0 || linkedinIntegrations.length > 0;

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
                Connect a Facebook Page or LinkedIn Company Page to start publishing posts.
              </AlertDescription>
            </Alert>
          )}

          {/* Connected Facebook Pages */}
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
                      <Facebook className="h-4 w-4 text-[#1877F2]" />
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

          {/* Connected LinkedIn Pages */}
          {linkedinIntegrations.map((integration) => {
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
                      alt={cfg.page_name ?? 'LinkedIn Page'}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="text-[#0A66C2]">
                      <Linkedin className="h-8 w-8" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                      <h4 className="font-medium">{cfg.page_name ?? 'LinkedIn Page'}</h4>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      LinkedIn Company Page
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

          {/* Connect Facebook */}
          <div className="flex items-center justify-between p-4 border-2 border-dashed rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-[#1877F2]">
                <Facebook className="h-8 w-8" />
              </div>
              <div>
                <h4 className="font-medium">
                  {facebookIntegrations.length > 0 ? 'Connect another Facebook Page' : 'Connect Facebook'}
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
                      onClick={() => startConnect('facebook')}
                      className="gap-2"
                      disabled={!canCreate.socialAccount || connecting !== null}
                    >
                      {connecting === 'facebook' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Redirecting…
                        </>
                      ) : (
                        <>
                          {facebookIntegrations.length > 0 ? 'Add Page' : 'Connect Facebook'}
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

          {/* Connect LinkedIn */}
          <div className="flex items-center justify-between p-4 border-2 border-dashed rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-[#0A66C2]">
                <Linkedin className="h-8 w-8" />
              </div>
              <div>
                <h4 className="font-medium">
                  {linkedinIntegrations.length > 0 ? 'Connect another LinkedIn Page' : 'Connect LinkedIn'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Authorize Causeio to publish posts to a LinkedIn Company Page you administer
                </p>
              </div>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      onClick={() => startConnect('linkedin')}
                      className="gap-2"
                      disabled={!canCreate.socialAccount || connecting !== null}
                    >
                      {connecting === 'linkedin' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Redirecting…
                        </>
                      ) : (
                        <>
                          {linkedinIntegrations.length > 0 ? 'Add Page' : 'Connect LinkedIn'}
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

        </CardContent>
      </Card>

      <AlertDialog open={!!pendingDisconnect} onOpenChange={(o) => !o && setPendingDisconnect(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {pendingDisconnect?.provider === 'linkedin' ? 'LinkedIn' : 'Facebook'} Page?</AlertDialogTitle>
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
