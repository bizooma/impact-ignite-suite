import { cn } from '@/lib/utils';

interface Props {
  score: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreBadge({ score, size = 'md', className }: Props) {
  if (score === null || score === undefined) {
    return (
      <span className={cn('inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold', sizeClasses(size), className)}>
        —
      </span>
    );
  }
  const color =
    score >= 85 ? 'bg-green-100 text-green-700 border-green-200'
    : score >= 60 ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-destructive/10 text-destructive border-destructive/20';

  return (
    <span className={cn('inline-flex items-center justify-center rounded-full border font-bold', color, sizeClasses(size), className)}>
      {score}
    </span>
  );
}

function sizeClasses(size: 'sm' | 'md' | 'lg') {
  switch (size) {
    case 'sm': return 'h-8 w-8 text-xs';
    case 'lg': return 'h-24 w-24 text-3xl';
    default: return 'h-12 w-12 text-base';
  }
}
