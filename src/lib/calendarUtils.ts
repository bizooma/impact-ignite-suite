import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, format, addDays } from 'date-fns';

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
