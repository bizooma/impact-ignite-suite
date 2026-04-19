import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useTierLimits } from '@/hooks/useTierLimits';
import { formatCap } from '@/lib/aiTierLimits';
import { Facebook, Instagram, Linkedin, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface SocialIntegrationsPanelProps {
  organizationId: string;
}

const SocialIntegrationsPanel: React.FC<SocialIntegrationsPanelProps> = ({ organizationId }) => {
  const { integrations, loading } = useIntegrations(organizationId);
  const { canCreate, limits, counts, tier } = useTierLimits(organizationId);

  const socialPlatforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'text-[#1877F2]',
      description: 'Connect your Facebook Page to publish posts',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'text-[#E4405F]',
      description: 'Connect your Instagram Business account',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-[#0A66C2]',
      description: 'Connect your LinkedIn Organization page',
    },
  ];

  const getIntegrationStatus = (platformId: string) => {
    const integration = integrations.find(
      (i) => i.provider === platformId && i.status === 'active'
    );
    return integration;
  };

  const handleConnect = (platformId: string) => {
    // This will be implemented when we create the OAuth edge function
    toast.info(`OAuth flow for ${platformId} will be implemented next`, {
      description: 'This will redirect you to authenticate with the platform',
    });
  };

  const handleDisconnect = async (platformId: string) => {
    toast.info(`Disconnect functionality will be implemented next`);
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

  const connectedCount = socialPlatforms.filter((p) =>
    getIntegrationStatus(p.id)
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Connections</CardTitle>
        <CardDescription>
          Connect your social media accounts to publish directly from the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectedCount === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to connect at least one social media account to publish posts.
              Click "Connect" below to get started.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {socialPlatforms.map((platform) => {
            const integration = getIntegrationStatus(platform.id);
            const isConnected = !!integration;
            const PlatformIcon = platform.icon;

            return (
              <div
                key={platform.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`${platform.color}`}>
                    <PlatformIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{platform.name}</h4>
                      {isConnected ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {platform.description}
                    </p>
                    {isConnected && integration?.config?.account_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Connected as: <span className="font-medium">{integration.config.account_name}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisconnect(platform.id)}
                      >
                        Disconnect
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConnect(platform.id)}
                      >
                        Reconnect
                      </Button>
                    </>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              size="sm"
                              onClick={() => handleConnect(platform.id)}
                              className="gap-2"
                              disabled={!canCreate.socialAccount}
                            >
                              Connect
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!canCreate.socialAccount && (
                          <TooltipContent>
                            <p>You've connected {counts.socialAccounts}/{formatCap(limits.socialAccounts)} social accounts on the {tier} plan.</p>
                            <Link to="/pricing" className="underline">Upgrade to add more</Link>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {connectedCount > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {connectedCount} of {socialPlatforms.length} platforms connected
              </span>
              <Button variant="link" size="sm" className="h-auto p-0">
                View Integration Settings
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialIntegrationsPanel;
