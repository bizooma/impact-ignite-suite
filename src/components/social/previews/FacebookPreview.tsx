import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal } from "lucide-react";

interface FacebookPreviewProps {
  content: string;
  mediaUrls: string[];
  organizationName: string;
  organizationLogo?: string;
}

export function FacebookPreview({ content, mediaUrls, organizationName, organizationLogo }: FacebookPreviewProps) {
  const displayContent = content || "Your post content will appear here...";
  const shouldTruncate = displayContent.length > 200;
  const truncatedContent = shouldTruncate ? displayContent.slice(0, 200) + "..." : displayContent;

  return (
    <Card className="w-full bg-background border">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <Avatar className="w-10 h-10 bg-primary/10">
          {organizationLogo ? (
            <img src={organizationLogo} alt={organizationName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-primary">{organizationName[0]}</span>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{organizationName}</p>
              <p className="text-xs text-muted-foreground">Just now · 🌎</p>
            </div>
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm whitespace-pre-wrap break-words">
          {truncatedContent}
          {shouldTruncate && <span className="text-primary cursor-pointer font-medium"> See more</span>}
        </p>
      </div>

      {/* Media Grid */}
      {mediaUrls.length > 0 && (
        <div className="w-full">
          {mediaUrls.length === 1 && (
            <img src={mediaUrls[0]} alt="Post media" className="w-full max-h-96 object-cover" />
          )}
          {mediaUrls.length === 2 && (
            <div className="grid grid-cols-2 gap-0.5">
              {mediaUrls.map((url, idx) => (
                <img key={idx} src={url} alt={`Media ${idx + 1}`} className="w-full h-64 object-cover" />
              ))}
            </div>
          )}
          {mediaUrls.length === 3 && (
            <div className="grid grid-cols-2 gap-0.5">
              <img src={mediaUrls[0]} alt="Media 1" className="w-full h-64 object-cover row-span-2" />
              <img src={mediaUrls[1]} alt="Media 2" className="w-full h-32 object-cover" />
              <img src={mediaUrls[2]} alt="Media 3" className="w-full h-32 object-cover" />
            </div>
          )}
          {mediaUrls.length >= 4 && (
            <div className="grid grid-cols-2 gap-0.5">
              {mediaUrls.slice(0, 4).map((url, idx) => (
                <div key={idx} className="relative">
                  <img src={url} alt={`Media ${idx + 1}`} className="w-full h-48 object-cover" />
                  {idx === 3 && mediaUrls.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">+{mediaUrls.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interaction Bar */}
      <div className="border-t mt-2">
        <div className="px-4 py-2 flex justify-between text-xs text-muted-foreground">
          <span>0 reactions</span>
          <span>0 comments · 0 shares</span>
        </div>
        <div className="border-t px-4 py-2 flex justify-around">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-accent px-4 py-2 rounded">
            <ThumbsUp className="w-4 h-4" />
            Like
          </button>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-accent px-4 py-2 rounded">
            <MessageCircle className="w-4 h-4" />
            Comment
          </button>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-accent px-4 py-2 rounded">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>
    </Card>
  );
}
