import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles, Filter } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import {
  getMonthDays,
  groupPostsByDate,
  formatTime,
  getAwarenessEventsForMonth,
} from '@/lib/calendarUtils';
import type { AwarenessEvent } from '@/lib/campaignTemplates/awarenessCalendar';
import { useSocialCalendarSettings } from '@/hooks/useSocialCalendarSettings';
import CalendarPostEntry from './CalendarPostEntry';
import { cn } from '@/lib/utils';

interface SocialCalendarProps {
  posts: any[];
  organizationId: string;
  onPostClick: (post: any) => void;
  selectedPlatforms: string[];
  selectedStatuses: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  health: 'Health',
  social: 'Social Justice',
  environment: 'Environment',
  youth: 'Youth & Education',
  arts: 'Arts & Culture',
  animals: 'Animals',
  giving: 'Giving Days',
  global: 'Global',
};

const SocialCalendar: React.FC<SocialCalendarProps> = ({
  posts,
  organizationId,
  onPostClick,
  selectedPlatforms,
  selectedStatuses,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();
  const {
    showAwarenessDays,
    enabledCategories,
    toggleShowAwarenessDays,
    toggleCategory,
    allCategories,
  } = useSocialCalendarSettings(organizationId);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (!post.scheduled_for) return false;
      if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(post.platform)) return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(post.status || 'draft')) return false;
      return true;
    });
  }, [posts, selectedPlatforms, selectedStatuses]);

  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const postsByDate = useMemo(() => groupPostsByDate(filteredPosts), [filteredPosts]);

  const { dayEvents, monthEvents } = useMemo(() => {
    if (!showAwarenessDays) {
      return { dayEvents: new Map<string, AwarenessEvent[]>(), monthEvents: [] };
    }
    return getAwarenessEventsForMonth(currentDate, enabledCategories);
  }, [currentDate, enabledCategories, showAwarenessDays]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => setCurrentDate((prev) => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="space-y-4">
      {/* Top toolbar: month nav + awareness controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="show-awareness-days"
              checked={showAwarenessDays}
              onCheckedChange={toggleShowAwarenessDays}
            />
            <Label htmlFor="show-awareness-days" className="text-sm cursor-pointer flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Awareness days
            </Label>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!showAwarenessDays}
                className="gap-1.5"
              >
                <Filter className="h-3.5 w-3.5" />
                Categories
                <span className="text-xs text-muted-foreground">
                  ({enabledCategories.length}/{allCategories.length})
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56">
              <div className="space-y-2">
                <div className="text-sm font-medium mb-2">Show categories</div>
                {allCategories.map((cat) => {
                  const checked = enabledCategories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent rounded px-2 py-1"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleCategory(cat)}
                      />
                      {CATEGORY_LABELS[cat] ?? cat}
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Month-long observance banner */}
          {showAwarenessDays && monthEvents.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-dashed">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {format(currentDate, 'MMMM')}:
              </span>
              {monthEvents.map((evt) => (
                <Popover key={evt.key}>
                  <PopoverTrigger asChild>
                    <button
                      className="text-xs px-2 py-0.5 rounded-full font-medium hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: `${evt.color}1a`,
                        color: evt.color,
                        border: `1px solid ${evt.color}40`,
                      }}
                    >
                      {evt.name}
                    </button>
                  </PopoverTrigger>
                  <AwarenessEventPopover event={evt} navigate={navigate} />
                </Popover>
              ))}
            </div>
          )}

          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day, index) => {
              const dateKey = format(day.date, 'yyyy-MM-dd');
              const dayPosts = postsByDate.get(dateKey) || [];
              const dayAwareness = showAwarenessDays ? dayEvents.get(dateKey) ?? [] : [];

              return (
                <div
                  key={index}
                  className={cn(
                    'min-h-[120px] border rounded-lg p-2',
                    day.isCurrentMonth ? 'bg-card' : 'bg-muted/30',
                    day.isToday && 'ring-2 ring-primary',
                  )}
                >
                  <div
                    className={cn(
                      'text-sm font-medium mb-2',
                      day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground',
                      day.isToday && 'text-primary',
                    )}
                  >
                    {format(day.date, 'd')}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[80px]">
                    {/* Awareness chips first so they're visually prominent */}
                    {dayAwareness.map((evt) => (
                      <Popover key={evt.key}>
                        <PopoverTrigger asChild>
                          <button
                            className="w-full text-left text-xs px-1.5 py-0.5 rounded truncate hover:opacity-80 transition-opacity flex items-center gap-1"
                            style={{
                              backgroundColor: `${evt.color}15`,
                              color: evt.color,
                              borderLeft: `2px dashed ${evt.color}`,
                            }}
                            title={evt.name}
                          >
                            <Sparkles className="h-3 w-3 shrink-0" />
                            <span className="truncate">{evt.name}</span>
                          </button>
                        </PopoverTrigger>
                        <AwarenessEventPopover
                          event={evt}
                          navigate={navigate}
                          dateForPost={day.date}
                        />
                      </Popover>
                    ))}

                    {dayPosts.slice(0, 3).map((post) => (
                      <CalendarPostEntry
                        key={post.id}
                        post={post}
                        time={formatTime(post.scheduled_for)}
                        onClick={() => onPostClick(post)}
                      />
                    ))}
                    {dayPosts.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center py-1">
                        +{dayPosts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Awareness event detail popover ---
interface PopoverProps {
  event: AwarenessEvent;
  navigate: ReturnType<typeof useNavigate>;
  dateForPost?: Date;
}

const AwarenessEventPopover: React.FC<PopoverProps> = ({ event, navigate, dateForPost }) => {
  return (
    <PopoverContent className="w-80">
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <div
            className="h-8 w-8 rounded-md shrink-0 flex items-center justify-center"
            style={{ backgroundColor: `${event.color}20`, color: event.color }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="font-semibold leading-tight">{event.name}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mt-0.5">
              {CATEGORY_LABELS[event.category] ?? event.category} ·{' '}
              {event.scope === 'month' ? 'Month-long' : event.scope === 'week' ? 'Week-long' : 'Single day'}
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{event.description}</p>

        <div className="flex flex-col gap-2 pt-1">
          <Button
            size="sm"
            className="w-full"
            onClick={() => navigate(`/dashboard/campaigns?template=${event.key}`)}
          >
            Create campaign for this
          </Button>
          {dateForPost && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() =>
                navigate(
                  `/dashboard/social?compose=1&date=${format(dateForPost, 'yyyy-MM-dd')}&awareness=${event.key}`,
                )
              }
            >
              Schedule a post for this day
            </Button>
          )}
        </div>
      </div>
    </PopoverContent>
  );
};

export default SocialCalendar;
