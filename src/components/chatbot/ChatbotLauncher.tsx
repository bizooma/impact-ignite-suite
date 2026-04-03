import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle } from 'lucide-react';
import { ChatbotWidgetConfig } from '@/types/database';

interface ChatbotLauncherProps {
  config: ChatbotWidgetConfig;
  onClick: () => void;
  unreadCount?: number;
}

export const ChatbotLauncher: React.FC<ChatbotLauncherProps> = ({
  config,
  onClick,
  unreadCount = 0,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const position = config.position || 'bottom-right';
  const launcherText = config.launcher_text || 'Need help?';
  const botName = config.bot_name || 'Assistant';

  // Position styles
  const positionStyles: Record<string, string> = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'middle-right': 'top-1/2 -translate-y-1/2 right-6',
    'middle-left': 'top-1/2 -translate-y-1/2 left-6',
  };

  const getVideoElement = () => {
    if (!config.video_source) return null;

    const videoType = config.video_type || 'youtube';
    
    if (videoType === 'youtube') {
      const videoId = config.video_source.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
      if (!videoId) return null;
      
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&playsinline=1&rel=0`}
          className="absolute inset-0 w-full h-full rounded-full object-cover pointer-events-none"
          allow="autoplay; encrypted-media"
          style={{ border: 'none' }}
        />
      );
    }

    if (videoType === 'vimeo') {
      const videoId = config.video_source.match(/vimeo\.com\/(\d+)/)?.[1];
      if (!videoId) return null;
      
      return (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1`}
          className="absolute inset-0 w-full h-full rounded-full object-cover pointer-events-none"
          allow="autoplay; encrypted-media"
          style={{ border: 'none' }}
        />
      );
    }

    // Direct video file
    return (
      <video
        src={config.video_source}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full rounded-full object-cover"
      />
    );
  };

  const launcher = (
    <button
      onClick={onClick}
      className={`fixed ${positionStyles[position]} z-[9998] group flex items-center gap-3 
        bg-primary text-primary-foreground rounded-full shadow-elevated
        hover:shadow-glow transition-all duration-300 hover:scale-105 animate-fade-in`}
      aria-label="Open chat"
    >
      {/* Video preview container */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-background">
        {config.video_source ? (
          getVideoElement()
        ) : (
          <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
        )}
        
        {/* Unread indicator */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground 
            rounded-full flex items-center justify-center text-xs font-bold animate-bounce">
            {unreadCount}
          </div>
        )}
      </div>

      {/* Launcher text and bot name */}
      <div className="pr-4 text-left max-w-[200px] hidden sm:block">
        <div className="text-sm font-medium">{botName}</div>
        <div className="text-xs opacity-90">{launcherText}</div>
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 
        group-hover:opacity-100 transition-opacity duration-300 -z-10" />
    </button>
  );

  if (!mounted) return null;
  
  return createPortal(launcher, document.body);
};
