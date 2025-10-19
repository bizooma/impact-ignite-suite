import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { getMonthDays, groupPostsByDate, formatTime } from '@/lib/calendarUtils';
import CalendarPostEntry from './CalendarPostEntry';
import { cn } from '@/lib/utils';

interface SocialCalendarProps {
  posts: any[];
  onPostClick: (post: any) => void;
  selectedPlatforms: string[];
  selectedStatuses: string[];
}

const SocialCalendar: React.FC<SocialCalendarProps> = ({
  posts,
  onPostClick,
  selectedPlatforms,
  selectedStatuses
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (!post.scheduled_for) return false;
      
      if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(post.platform)) {
        return false;
      }
      
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(post.status || 'draft')) {
        return false;
      }
      
      return true;
    });
  }, [posts, selectedPlatforms, selectedStatuses]);

  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const postsByDate = useMemo(() => groupPostsByDate(filteredPosts), [filteredPosts]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
        </div>
        <div className="w-[140px]" /> {/* Spacer for centering */}
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day, index) => {
              const dateKey = format(day.date, 'yyyy-MM-dd');
              const dayPosts = postsByDate.get(dateKey) || [];

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[120px] border rounded-lg p-2",
                    day.isCurrentMonth ? "bg-card" : "bg-muted/30",
                    day.isToday && "ring-2 ring-primary"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-2",
                    day.isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                    day.isToday && "text-primary"
                  )}>
                    {format(day.date, 'd')}
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[80px]">
                    {dayPosts.slice(0, 3).map(post => (
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

export default SocialCalendar;
