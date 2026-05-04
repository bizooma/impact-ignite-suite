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
    <Card className="relative overflow-hidden border border-amber-500/30 bg-[#0a0a0f] text-amber-50 shadow-2xl">
      {/* Ambient gold glow background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse at top right, rgba(245,197,66,0.18), transparent 55%), radial-gradient(ellipse at bottom left, rgba(245,197,66,0.10), transparent 60%)',
        }}
        aria-hidden="true"
      />
      {/* Subtle particle dots */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(rgba(245,197,66,0.35) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />
      {/* Top gold accent bar */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <CardHeader className="relative space-y-3 pt-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            Founding Member
          </span>
        </div>
        <CardTitle className="font-serif text-4xl font-bold tracking-tight">
          You're a{' '}
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
            VIP
          </span>
        </CardTitle>
        <p className="max-w-2xl text-amber-100/70">
          Thank you for being one of our earliest believers. Here's what your founder
          status unlocks — for life.
        </p>
      </CardHeader>

      <CardContent className="relative space-y-8">
        {/* Benefits grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="group relative overflow-hidden rounded-lg border border-amber-400/20 bg-gradient-to-br from-white/[0.04] to-amber-500/[0.04] p-5 backdrop-blur transition-all hover:border-amber-400/50 hover:shadow-[0_0_30px_-5px_rgba(245,197,66,0.35)]"
            >
              <div className="mb-3 text-2xl" aria-hidden="true">
                {b.icon}
              </div>
              <h3 className="mb-1 font-semibold text-amber-100">{b.title}</h3>
              <p className="text-sm text-amber-100/60">{b.description}</p>
            </div>
          ))}
        </div>

        {/* Feedback form */}
        <div className="space-y-4 rounded-lg border border-amber-400/20 bg-white/[0.03] p-6 backdrop-blur">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-xl font-semibold text-amber-100">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              Help shape what's next
            </h3>
            <p className="text-sm text-amber-100/60">
              Your feedback goes straight to the founders. We read every submission and
              prioritize what beta members ask for.
            </p>
          </div>
          <div className="[&_label]:text-amber-100/80">
            <FeedbackForm
              organizationId={organizationId}
              fieldClassName="bg-white/5 border-amber-400/20 text-amber-50 placeholder:text-amber-100/40"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
