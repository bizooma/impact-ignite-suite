import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ThumbsUp, MessageCircle, Repeat2, Send, MoreHorizontal } from "lucide-react";

interface LinkedInPreviewProps {
  content: string;
  mediaUrls: string[];
  organizationName: string;
  organizationLogo?: string;
}

export function LinkedInPreview({ content, mediaUrls, organizationName, organizationLogo }: LinkedInPreviewProps) {
  const displayContent = content || "Your post content will appear here...";
  const shouldTruncate = displayContent.length > 140;
  const truncatedContent = shouldTruncate ? displayContent.slice(0, 140) + "..." : displayContent;

  return (
    <Card className="w-full bg-background border">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <Avatar className="w-12 h-12 bg-primary/10 border-2 border-primary/20">
          {organizationLogo ? (
            <img src={organizationLogo} alt={organizationName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-primary">{organizationName[0]}</span>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm hover:underline cursor-pointer text-primary">{organizationName}</p>
              <p className="text-xs text-muted-foreground">Company · Professional Services</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Just now · 🌐
              </p>
            </div>
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {truncatedContent}
          {shouldTruncate && <span className="text-muted-foreground cursor-pointer">...see more</span>}
        </p>
      </div>

      {/* Media */}
      {mediaUrls.length > 0 && (
        <div className="w-full border-t border-b bg-muted">
          {mediaUrls.length === 1 && (
            <img src={mediaUrls[0]} alt="Post media" className="w-full max-h-96 object-cover" />
          )}
          {mediaUrls.length > 1 && (
            <div className="grid grid-cols-2 gap-1 p-1">
              {mediaUrls.slice(0, 4).map((url, idx) => (
                <div key={idx} className="relative">
                  <img src={url} alt={`Media ${idx + 1}`} className="w-full h-48 object-cover rounded" />
                  {idx === 3 && mediaUrls.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
                      <span className="text-white text-xl font-semibold">+{mediaUrls.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Engagement Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground border-b">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border border-background">
              <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />
            </div>
          </div>
          <span>0</span>
        </div>
        <div className="flex gap-2">
          <span>0 comments</span>
          <span>·</span>
          <span>0 reposts</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2 flex justify-around">
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-accent px-4 py-2 rounded">
          <ThumbsUp className="w-5 h-5" />
          Like
        </button>
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-accent px-4 py-2 rounded">
          <MessageCircle className="w-5 h-5" />
          Comment
        </button>
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-accent px-4 py-2 rounded">
          <Repeat2 className="w-5 h-5" />
          Repost
        </button>
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-accent px-4 py-2 rounded">
          <Send className="w-5 h-5" />
          Send
        </button>
      </div>
    </Card>
  );
}
