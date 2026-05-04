import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { useBrandKit } from '@/hooks/useBrandKit';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useChatbots } from '@/hooks/useChatbots';
import { useQrCodes } from '@/hooks/useQrCodes';
import { useTeamMembers } from '@/hooks/useTeamMembers';

interface OnboardingChecklistProps {
  organizationId: string;
}

export function OnboardingChecklist({ organizationId }: OnboardingChecklistProps) {
  const { brandKit } = useBrandKit(organizationId);
  const { state, update } = useOnboardingState(organizationId);
  const { integrations } = useIntegrations(organizationId);
  const { chatbots } = useChatbots(organizationId);
  const { qrCodes } = useQrCodes(organizationId);
  const { teamMembers: members } = useTeamMembers(organizationId);

  const brandKitDone = !!brandKit?.setup_completed_at;
  const integrationDone = (integrations?.length || 0) > 0;
  const firstAssetDone = (chatbots?.length || 0) > 0 || (qrCodes?.length || 0) > 0;
  const teamInvited = (members?.length || 0) > 1;

  const completed = useMemo(
    () => [brandKitDone, integrationDone, firstAssetDone, teamInvited].filter(Boolean).length,
    [brandKitDone, integrationDone, firstAssetDone, teamInvited],
  );

  // Sync derived flags back to org_onboarding_state so other UI can rely on them
  useEffect(() => {
    if (!state) return;
    const patch: Record<string, boolean> = {};
    if (state.brand_kit_done !== brandKitDone) patch.brand_kit_done = brandKitDone;
    if (state.integration_connected !== integrationDone) patch.integration_connected = integrationDone;
    if (state.first_asset_created !== firstAssetDone) patch.first_asset_created = firstAssetDone;
    if (state.team_member_invited !== teamInvited) patch.team_member_invited = teamInvited;
    if (Object.keys(patch).length > 0) {
      update(patch).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandKitDone, integrationDone, firstAssetDone, teamInvited]);

  if (completed === 4) return null;

  const steps = [
    {
      done: brandKitDone,
      title: 'Set up your Brand Kit',
      description: 'Colors, fonts, logos, and voice — applied across every app.',
      to: '/dashboard/brand-kit',
    },
    {
      done: integrationDone,
      title: 'Connect your first integration',
      description: 'Mailchimp, Google Business, social accounts, or Stripe.',
      to: '/dashboard/integrations',
    },
    {
      done: firstAssetDone,
      title: 'Create your first chatbot or QR code',
      description: 'Put your platform to work for your community.',
      to: '/dashboard/chatbots',
    },
    {
      done: teamInvited,
      title: 'Invite a team member',
      description: 'Collaborate with staff and volunteers.',
      to: '/dashboard/members',
    },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Get started · {completed} of 4 complete</CardTitle>
        </div>
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`h-1.5 rounded ${s.done ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y">
          {steps.map((s) => (
            <li key={s.title}>
              <Link
                to={s.to}
                className="flex items-center gap-3 py-3 hover:bg-accent/30 -mx-2 px-2 rounded transition-colors"
              >
                {s.done ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${s.done ? 'line-through text-muted-foreground' : ''}`}>
                    {s.title}
                  </div>
                  {!s.done && (
                    <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>
                  )}
                </div>
                {!s.done && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
