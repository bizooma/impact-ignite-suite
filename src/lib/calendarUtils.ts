import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, format, addDays } from 'date-fns';
import { AWARENESS_EVENTS, type AwarenessEvent } from './campaignTemplates/awarenessCalendar';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface CalendarPost {
  id: string;
  content: string;
  platform: string;
  scheduled_for: string;
  status: string;
  media_urls?: string[];
  campaign_id?: string;
}

export function getMonthDays(date: Date): CalendarDay[] {
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));
  
  const days = eachDayOfInterval({ start, end });
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  
  return days.map(day => ({
    date: day,
    isCurrentMonth: day >= monthStart && day <= monthEnd,
    isToday: isToday(day)
  }));
}

export function getWeekDays(date: Date): CalendarDay[] {
  const start = startOfWeek(date);
  const end = endOfWeek(date);
  
  const days = eachDayOfInterval({ start, end });
  
  return days.map(day => ({
    date: day,
    isCurrentMonth: true,
    isToday: isToday(day)
  }));
}

export function groupPostsByDate(posts: CalendarPost[]): Map<string, CalendarPost[]> {
  const grouped = new Map<string, CalendarPost[]>();
  
  posts.forEach(post => {
    if (post.scheduled_for) {
      const dateKey = format(new Date(post.scheduled_for), 'yyyy-MM-dd');
      const existing = grouped.get(dateKey) || [];
      grouped.set(dateKey, [...existing, post]);
    }
  });
  
  // Sort posts within each day by time
  grouped.forEach((posts, key) => {
    posts.sort((a, b) => 
      new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
    );
  });
  
  return grouped;
}

export function formatTime(dateString: string): string {
  return format(new Date(dateString), 'h:mma').toLowerCase();
}

export function isSameDayCustom(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}

/**
 * Resolve every awareness event for the year of `monthDate` and bucket them
 * by exact day (for "day" scope) or by month (for "month" / "week" scope).
 *
 * Returns only events whose category is in `enabledCategories`.
 */
export function getAwarenessEventsForMonth(
  monthDate: Date,
  enabledCategories: string[],
): {
  dayEvents: Map<string, AwarenessEvent[]>;
  monthEvents: AwarenessEvent[];
} {
  const year = monthDate.getFullYear();
  const monthNum = monthDate.getMonth() + 1; // 1-12
  const enabled = new Set(enabledCategories);

  const dayEvents = new Map<string, AwarenessEvent[]>();
  const monthEvents: AwarenessEvent[] = [];

  for (const event of AWARENESS_EVENTS) {
    if (!enabled.has(event.category)) continue;
    if (event.month !== monthNum) continue;

    if (event.scope === 'month') {
      monthEvents.push(event);
      continue;
    }

    // 'day' or 'week' — resolve to a specific date and bucket it
    const date = event.resolve
      ? event.resolve(year)
      : new Date(year, event.month - 1, event.day || 1);
    const key = format(date, 'yyyy-MM-dd');
    const existing = dayEvents.get(key) ?? [];
    dayEvents.set(key, [...existing, event]);
  }

  return { dayEvents, monthEvents };
}
