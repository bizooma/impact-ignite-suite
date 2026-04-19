import { Card } from '@/components/ui/card';

interface Props {
  raised: number;
  goal: number | null;
  currency?: string;
  themeColor?: string;
}

export function GoalThermometer({ raised, goal, currency = 'USD', themeColor = '#dc2626' }: Props) {
  const percent = goal ? Math.min(100, (raised / goal) * 100) : 0;
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

  return (
    <Card className="p-6">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-3xl font-bold" style={{ color: themeColor }}>{fmt(raised)}</div>
          <div className="text-sm text-muted-foreground">raised{goal ? ` of ${fmt(goal)}` : ''}</div>
        </div>
        <div className="text-2xl font-semibold text-muted-foreground">{percent.toFixed(0)}%</div>
      </div>
      <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: themeColor }}
        />
      </div>
    </Card>
  );
}
