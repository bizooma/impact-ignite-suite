import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Lightbulb } from 'lucide-react';
import { FeedbackForm } from './FeedbackCard';

interface BetaVipSectionProps {
  organizationId: string;
}

const BENEFITS = [
  {
    icon: '💎',
    title: 'Founder-Level Pricing',
    description: "Lock in the lowest pricing we'll ever offer.",
  },
  {
    icon: '⚡',
    title: 'Priority Access',
    description: 'Be first to new features and releases.',
  },
  {
    icon: '🧠',
    title: 'Direct Influence',
    description: 'Your feedback shapes the roadmap.',
  },
  {
    icon: '🤝',
    title: 'Private Access',
    description: 'Invitations to beta programs and private demos.',
  },
  {
    icon: '📈',
    title: 'Unfair Advantage',
    description: "Use tools your competitors don't even know about yet.",
  },
  {
    icon: '✦',
    title: 'Members-Only Network',
    description: 'Connect with a curated circle of early adopters.',
  },
];

export function BetaVipSection({ organizationId }: BetaVipSectionProps) {
  return (
    <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/30 shadow-lg">
      {/* Decorative gold accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

      <CardHeader className="space-y-3 pt-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            Founding Member
          </span>
        </div>
        <CardTitle className="text-3xl font-bold">You're a VIP</CardTitle>
        <p className="max-w-2xl text-muted-foreground">
          Thank you for being one of our earliest believers. Here's what your founder
          status unlocks — for life.
        </p>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Benefits grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="group rounded-lg border border-border/60 bg-background/60 p-4 backdrop-blur transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="mb-2 text-2xl" aria-hidden="true">
                {b.icon}
              </div>
              <h3 className="mb-1 font-semibold text-foreground">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>

        {/* Feedback form */}
        <div className="space-y-4 rounded-lg border border-border/60 bg-background/60 p-6 backdrop-blur">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Help shape what's next
            </h3>
            <p className="text-sm text-muted-foreground">
              Your feedback goes straight to the founders. We read every submission and
              prioritize what beta members ask for.
            </p>
          </div>
          <FeedbackForm organizationId={organizationId} fieldClassName="bg-background" />
        </div>
      </CardContent>
    </Card>
  );
}
