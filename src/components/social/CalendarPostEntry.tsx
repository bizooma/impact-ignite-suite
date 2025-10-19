import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CalendarPostEntryProps {
  post: {
    id: string;
    content: string;
    platform: string;
    scheduled_for: string;
    status: string;
    media_urls?: string[];
  };
  time: string;
  onClick: () => void;
}

const CalendarPostEntry: React.FC<CalendarPostEntryProps> = ({ post, time, onClick }) => {
  const getPlatformIcon = (platform: string) => {
    const iconClass = "h-3 w-3";
    switch (platform) {
      case 'facebook': return <Facebook className={iconClass} />;
      case 'twitter': return <Twitter className={iconClass} />;
      case 'instagram': return <Instagram className={iconClass} />;
      case 'linkedin': return <Linkedin className={iconClass} />;
      default: return <Share2 className={iconClass} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-success';
      case 'scheduled': return 'bg-warning';
      case 'failed': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-2 rounded-md hover:bg-accent transition-colors",
        "border border-border mb-1 last:mb-0"
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn("w-1 h-1 rounded-full mt-1.5 flex-shrink-0", getStatusColor(post.status))} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {getPlatformIcon(post.platform)}
            <span className="text-xs font-medium text-muted-foreground">{time}</span>
            {post.media_urls && post.media_urls.length > 0 && (
              <Badge variant="secondary" className="h-4 text-[10px] px-1">
                📎 {post.media_urls.length}
              </Badge>
            )}
          </div>
          <p className="text-xs text-foreground line-clamp-2">
            {post.content.substring(0, 50)}{post.content.length > 50 ? '...' : ''}
          </p>
        </div>
      </div>
    </button>
  );
};

export default CalendarPostEntry;
