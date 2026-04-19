import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface Props {
  targetDate: string | null;
  label?: string;
}

export function CountdownClock({ targetDate, label = 'Until event' }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!targetDate) return null;
  // Parse YYYY-MM-DD as LOCAL date to avoid UTC shift
  const [y, m, d] = targetDate.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const diff = target.getTime() - now.getTime();
  const days = Math.max(0, Math.floor(diff / 86_400_000));
  const hours = Math.max(0, Math.floor((diff % 86_400_000) / 3_600_000));
  const isPast = diff < 0;

  return (
    <Card className="p-6 text-center">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      {isPast ? (
        <div className="text-3xl font-bold text-muted-foreground">Event passed</div>
      ) : (
        <div className="flex items-baseline justify-center gap-3">
          <div>
            <div className="text-4xl font-bold">{days}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </div>
          <div className="text-3xl text-muted-foreground">:</div>
          <div>
            <div className="text-4xl font-bold">{hours}</div>
            <div className="text-xs text-muted-foreground">hours</div>
          </div>
        </div>
      )}
      <div className="mt-2 text-sm text-muted-foreground">{target.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
    </Card>
  );
}
