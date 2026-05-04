import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Calendar, Plus, Search } from 'lucide-react';
import { AWARENESS_EVENTS, getNextOccurrence, daysUntil, type AwarenessEvent } from '@/lib/campaignTemplates/awarenessCalendar';
import { CampaignBriefWizard } from './CampaignBriefWizard';

interface Props {
  organizationId: string;
}

const CATEGORY_LABELS: Record<AwarenessEvent['category'], string> = {
  health: 'Health',
  social: 'Social Justice',
  environment: 'Environment',
  youth: 'Youth & Education',
  arts: 'Arts',
  animals: 'Animals',
  giving: 'Giving',
  global: 'Global',
};

export function CampaignInspirationGrid({ organizationId }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);

  const sorted = useMemo(() => {
    const today = new Date();
    return AWARENESS_EVENTS
      .map((e) => ({ event: e, date: getNextOccurrence(e, today) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, []);

  const filtered = useMemo(() => {
    return sorted.filter(({ event }) => {
      if (activeCategory !== 'all' && event.category !== activeCategory) return false;
      if (search && !event.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [sorted, activeCategory, search]);

  const categories: Array<{ key: string; label: string }> = [
    { key: 'all', label: 'All' },
    ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label })),
  ];

  const handleCreate = () => {
    // Open the brief wizard. User picks a starting point (including the awareness moments) inside it.
    setWizardOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Campaign ideas</h2>
        <span className="text-sm text-muted-foreground">
          National & international observances relevant to nonprofits
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search observances..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat.key}
              variant={activeCategory === cat.key ? 'default' : 'secondary'}
              className="cursor-pointer hover:opacity-80"
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(({ event, date }) => {
          const days = daysUntil(date);
          const dateLabel =
            event.scope === 'month'
              ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          return (
            <Card
              key={event.key}
              className="p-4 flex flex-col group hover:shadow-md transition-shadow"
              style={{ borderLeft: `4px solid ${event.color}` }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm leading-snug flex-1">{event.name}</h3>
                <Badge variant="outline" className="text-xs whitespace-nowrap shrink-0">
                  {days > 0 ? `${days}d` : 'Now'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3 flex-1">{event.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{dateLabel}</span>
                </div>
                <span className="capitalize">{CATEGORY_LABELS[event.category]}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={handleCreate}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Start a brief
              </Button>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          No observances match your filters.
        </Card>
      )}

      <CampaignBriefWizard open={wizardOpen} onOpenChange={setWizardOpen} organizationId={organizationId} />
    </div>
  );
}
