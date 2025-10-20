import React from 'react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  videoSource?: string;
  videoType?: 'youtube' | 'vimeo' | 'direct';
  ctaText?: string;
  onContinue: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoSource,
  videoType = 'youtube',
  ctaText = 'See how your support helps',
  onContinue,
}) => {
  if (!videoSource) return null;

  const getVideoElement = () => {
    if (videoType === 'youtube') {
      const videoId = videoSource.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
      if (!videoId) return null;
      
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&loop=1&playlist=${videoId}&controls=1&modestbranding=1&playsinline=1&rel=0`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media"
          style={{ border: 'none' }}
        />
      );
    }

    if (videoType === 'vimeo') {
      const videoId = videoSource.match(/vimeo\.com\/(\d+)/)?.[1];
      if (!videoId) return null;
      
      return (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1&muted=0&loop=1&background=1`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media"
          style={{ border: 'none' }}
        />
      );
    }

    // Direct video file
    return (
      <video
        src={videoSource}
        autoPlay
        loop
        playsInline
        controls
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  };

  return (
    <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
      {getVideoElement()}
    </div>
  );
};
