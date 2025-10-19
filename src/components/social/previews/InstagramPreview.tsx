import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";

interface InstagramPreviewProps {
  content: string;
  mediaUrls: string[];
  organizationName: string;
  organizationLogo?: string;
}

export function InstagramPreview({ content, mediaUrls, organizationName, organizationLogo }: InstagramPreviewProps) {
  const displayContent = content || "Your caption will appear here...";
  const shouldTruncate = displayContent.length > 125;
  const truncatedContent = shouldTruncate ? displayContent.slice(0, 125) + "..." : displayContent;
  
  // Format hashtags
  const formatCaption = (text: string) => {
    return text.split(/(\s+)/).map((word, idx) => {
      if (word.startsWith('#')) {
        return <span key={idx} className="text-primary">{word}</span>;
      }
      return <span key={idx}>{word}</span>;
    });
  };

  return (
    <Card className="w-full max-w-md bg-background border">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 bg-primary/10">
            {organizationLogo ? (
              <img src={organizationLogo} alt={organizationName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-primary">{organizationName[0]}</span>
            )}
          </Avatar>
          <span className="font-semibold text-sm">{organizationName}</span>
        </div>
        <MoreHorizontal className="w-5 h-5" />
      </div>

      {/* Media */}
      {mediaUrls.length > 0 ? (
        <div className="relative aspect-square bg-muted">
          <img 
            src={mediaUrls[0]} 
            alt="Post media" 
            className="w-full h-full object-cover"
          />
          {mediaUrls.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              1/{mediaUrls.length}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-square bg-muted flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Add images to see preview</p>
        </div>
      )}

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6" />
            <MessageCircle className="w-6 h-6" />
            <Send className="w-6 h-6" />
          </div>
          <Bookmark className="w-6 h-6" />
        </div>

        {/* Likes */}
        <p className="text-sm font-semibold">0 likes</p>

        {/* Caption */}
        {displayContent && (
          <div className="text-sm">
            <span className="font-semibold mr-2">{organizationName}</span>
            <span className="whitespace-pre-wrap break-words">
              {formatCaption(truncatedContent)}
              {shouldTruncate && <span className="text-muted-foreground"> more</span>}
            </span>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground uppercase">Just now</p>
      </div>
    </Card>
  );
}
