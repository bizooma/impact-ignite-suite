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
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1&playsinline=1&rel=0`}
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
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1`}
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
        muted
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
      
      {/* Gradient overlay with CTA */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent 
        flex flex-col justify-end p-6">
        <p className="text-lg font-semibold text-foreground mb-3">
          {ctaText}
        </p>
        <Button 
          onClick={onContinue}
          variant="secondary"
          className="w-full sm:w-auto"
        >
          Continue to chat
        </Button>
      </div>
    </div>
  );
};
