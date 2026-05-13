import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Infinity as InfinityIcon, AlertTriangle } from 'lucide-react';
import { getTierLimits, normalizeTier, usageBucket, usagePct } from '@/lib/aiTierLimits';

interface AIUsageDashboardProps {
  organizationId: string;
}

export function AIUsageDashboard({ organizationId }: AIUsageDashboardProps) {
  // Org tier
  const { data: org } = useQuery({
    queryKey: ['org-tier', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('subscription_tier')
        .eq('id', organizationId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // BYO key status
  const { data: byo } = useQuery({
    queryKey: ['byo-key-active', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('integrations')
        .select('id, status')
        .eq('organization_id', organizationId)
        .eq('provider', 'openai')
        .eq('status', 'active')
        .maybeSingle();
      return !!data;
    },
  });

  // Optional cap override
  const { data: override } = useQuery({
    queryKey: ['org-cap-override', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('org_ai_usage_overrides')
        .select('monthly_message_cap')
        .eq('organization_id', organizationId)
        .maybeSingle();
      return data?.monthly_message_cap ?? null;
    },
  });

  // Current period usage
  const { data: usage, isLoading } = useQuery({
    queryKey: ['ai-usage-current', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('org_ai_usage_current_period')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      return data;
    },
    refetchInterval: 30_000,
  });

  const tier = normalizeTier(org?.subscription_tier);
  const tierInfo = getTierLimits(tier);
  const cap = override ?? tierInfo.monthlyMessageCap;
  const usedPlatform = (usage?.messages_count_platform as number | undefined) ?? 0;
  const usedByo = (usage?.messages_count_byo as number | undefined) ?? 0;
  const totalMessages = usedPlatform + usedByo;
  const pct = byo ? 0 : usagePct(usedPlatform, cap);
  const bucket = usageBucket(pct);

  const periodStart = usage?.period_start
    ? new Date(usage.period_start as string)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
  const daysLeft = Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          AI Usage — This Month
        </CardTitle>
        <CardDescription>
          Tracks chatbot messages and embedding calls for the current calendar month.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{tierInfo.label} tier</Badge>
            {byo ? (
              <Badge variant="secondary" className="gap-1">
                <InfinityIcon className="h-3 w-3" />
                BYO Key — uncapped
              </Badge>
            ) : override ? (
              <Badge variant="secondary">Custom cap</Badge>
            ) : null}
          </div>
          <span className="text-xs text-muted-foreground">{daysLeft} days left in period</span>
        </div>

        {byo ? (
          <Alert>
            <InfinityIcon className="h-4 w-4" />
            <AlertDescription>
              Using your own OpenAI key — usage is metered but not capped. Total messages this month:{' '}
              <strong>{totalMessages.toLocaleString()}</strong>
            </AlertDescription>
          </Alert>
        ) : cap === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              AI chatbot messaging isn't included on the {tierInfo.label} tier.{' '}
              <a href="/pricing" className="underline font-medium">Upgrade your plan</a> to enable
              chatbots, or add your own OpenAI key below to use BYO billing.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">
                  {usedPlatform.toLocaleString()} / {cap.toLocaleString()} messages
                </span>
                <span className="text-muted-foreground">{Math.round(pct * 100)}%</span>
              </div>
              <Progress value={pct * 100} />
            </div>

            {bucket === 'blocked' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Monthly cap reached. Chatbot is blocked until next month, you upgrade your
                  subscription, or you add your own OpenAI key below.
                </AlertDescription>
              </Alert>
            )}
            {bucket === 'critical' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Over 95% of monthly cap used. Add a BYO key or upgrade to avoid service
                  interruption.
                </AlertDescription>
              </Alert>
            )}
            {bucket === 'warn' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  80% of monthly cap used.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <Stat label="Platform messages" value={usedPlatform.toLocaleString()} />
          <Stat label="BYO messages" value={usedByo.toLocaleString()} />
          <Stat label="Embedding calls" value={(usage?.embeddings_count as number ?? 0).toLocaleString()} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
