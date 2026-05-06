import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, HelpCircle, Sparkles, Loader2 } from 'lucide-react';
import { runChecks, scoreChecks, type CampaignContent } from '@/lib/accessnotify/accessibilityReviewService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface Props {
  campaign: CampaignContent;
  onAcknowledge?: () => void;
  onRewrite?: (rewritten: string) => void;
  acknowledged?: boolean;
}

export function AccessibilityReviewPanel({ campaign, onAcknowledge, onRewrite, acknowledged }: Props) {
  const checks = useMemo(() => runChecks(campaign), [campaign]);
  const score = scoreChecks(checks);
  const hasWarnings = checks.some((c) => c.status !== 'pass');
  const [improving, setImproving] = useState(false);
  const { toast } = useToast();

  const handleImprove = async () => {
    if (!campaign.email_body) {
      toast({ title: 'Add an email body first', variant: 'destructive' });
      return;
    }
    setImproving(true);
    try {
      const { data, error } = await supabase.functions.invoke('accessnotify-ai-rewrite', {
        body: { text: campaign.email_body, mode: 'accessible' },
      });
      if (error) throw error;
      if (data?.rewritten && onRewrite) {
        onRewrite(data.rewritten);
        toast({ title: 'Message improved', description: 'Review the new version below.' });
      }
    } catch (e: any) {
      toast({ title: 'AI rewrite failed', description: e.message, variant: 'destructive' });
    } finally {
      setImproving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Accessibility Review</h3>
            <p className="text-sm text-muted-foreground">Score: {score}/100</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleImprove} disabled={improving}>
              {improving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Improve with AI
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {checks.map((c) => {
            const Icon = c.status === 'pass' ? CheckCircle2 : c.status === 'warning' ? AlertTriangle : HelpCircle;
            const color =
              c.status === 'pass' ? 'text-green-600' : c.status === 'warning' ? 'text-amber-600' : 'text-muted-foreground';
            return (
              <div key={c.key} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                <Icon className={`w-4 h-4 mt-1 shrink-0 ${color}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.label}</span>
                    <Badge
                      variant={c.status === 'pass' ? 'default' : c.status === 'warning' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {c.status === 'pass' ? 'Pass' : c.status === 'warning' ? 'Warning' : 'Needs Review'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {hasWarnings && onAcknowledge && (
          <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3">
            <p className="text-sm mb-2">
              This message has accessibility warnings. You can fix them above, or send with documented acknowledgment.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!acknowledged} onChange={() => onAcknowledge()} />
              I acknowledge the accessibility warnings
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
