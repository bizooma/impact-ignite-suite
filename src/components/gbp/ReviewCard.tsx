import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, CheckCircle, XCircle, Edit2, RotateCw, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ReviewCardProps {
  review: {
    id: string;
    reviewer_name: string;
    reviewer_photo_url: string | null;
    rating: number;
    review_text: string | null;
    review_date: string;
    reply_status: 'pending_ai' | 'awaiting_approval' | 'approved' | 'posted' | 'rejected';
    ai_generated_response: string | null;
    edited_response: string | null;
    final_response: string | null;
    posted_at: string | null;
  };
  onApprove: (reviewId: string, editedResponse?: string) => void;
  onEdit: (reviewId: string, newResponse: string) => void;
  onReject: (reviewId: string, reason?: string) => void;
  onRegenerate: (reviewId: string) => void;
}

export const ReviewCard = ({
  review,
  onApprove,
  onEdit,
  onReject,
  onRegenerate,
}: ReviewCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponse, setEditedResponse] = useState(
    review.edited_response || review.ai_generated_response || ''
  );

  const getStatusBadge = () => {
    const statusConfig = {
      pending_ai: { label: 'AI Generating...', variant: 'default' as const, className: 'bg-blue-500' },
      awaiting_approval: { label: 'Awaiting Approval', variant: 'default' as const, className: 'bg-orange-500' },
      approved: { label: 'Approved', variant: 'default' as const, className: 'bg-green-500' },
      posted: { label: 'Posted ✓', variant: 'default' as const, className: 'bg-muted' },
      rejected: { label: 'Rejected', variant: 'destructive' as const, className: '' },
    };

    const config = statusConfig[review.reply_status];
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const renderStars = () => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= review.rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleSaveEdit = () => {
    onEdit(review.id, editedResponse);
    setIsEditing(false);
  };

  const handleApprove = () => {
    if (isEditing) {
      onApprove(review.id, editedResponse);
      setIsEditing(false);
    } else {
      onApprove(review.id);
    }
  };

  const displayResponse = isEditing ? editedResponse : (review.final_response || review.edited_response || review.ai_generated_response);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Reviewer Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar>
              <AvatarImage src={review.reviewer_photo_url || undefined} />
              <AvatarFallback>{review.reviewer_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{review.reviewer_name}</div>
              <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(review.review_date), { addSuffix: true })}
              </div>
              {renderStars()}
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Review Text */}
        {review.review_text && (
          <div className="text-sm">
            <p className="text-foreground">{review.review_text}</p>
          </div>
        )}

        {/* AI Response Section */}
        {review.reply_status === 'pending_ai' ? (
          <div className="bg-muted rounded-lg p-4 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">AI is generating a response...</span>
          </div>
        ) : displayResponse && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>🤖 {isEditing ? 'Edit Response' : 'AI Suggested Response'}:</span>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedResponse}
                  onChange={(e) => setEditedResponse(e.target.value)}
                  className="min-h-[100px]"
                  maxLength={4096}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {editedResponse.length} / 4096 characters
                </div>
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-4 text-sm">
                {displayResponse}
              </div>
            )}
          </div>
        )}

        {review.posted_at && (
          <div className="text-xs text-muted-foreground">
            Posted {formatDistanceToNow(new Date(review.posted_at), { addSuffix: true })}
          </div>
        )}
      </CardContent>

      {/* Action Buttons */}
      {review.reply_status !== 'posted' && review.reply_status !== 'rejected' && (
        <CardFooter className="flex gap-2 flex-wrap">
          {review.reply_status === 'awaiting_approval' && (
            <>
              {isEditing ? (
                <>
                  <Button onClick={handleSaveEdit} size="sm" variant="default">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Save Changes
                  </Button>
                  <Button onClick={() => setIsEditing(false)} size="sm" variant="outline">
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleApprove} size="sm" variant="default">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve & Post
                  </Button>
                  <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button onClick={() => onReject(review.id)} size="sm" variant="outline">
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button onClick={() => onRegenerate(review.id)} size="sm" variant="ghost">
                    <RotateCw className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
                </>
              )}
            </>
          )}
          {review.reply_status === 'approved' && (
            <Button onClick={handleApprove} size="sm" variant="default">
              <CheckCircle className="h-4 w-4 mr-1" />
              Post to Google
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};
