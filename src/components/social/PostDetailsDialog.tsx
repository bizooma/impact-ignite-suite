import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Facebook, Twitter, Instagram, Linkedin, Share2, Calendar, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface PostDetailsDialogProps {
  post: {
    id: string;
    content: string;
    platform: string;
    scheduled_for: string;
    status: string;
    media_urls?: string[];
    created_at: string;
    external_post_id?: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onPublish?: (postId: string) => void;
}

const PostDetailsDialog: React.FC<PostDetailsDialogProps> = ({
  post,
  open,
  onClose,
  onEdit,
  onDelete,
  onPublish
}) => {
  if (!post) return null;

  const getPlatformIcon = (platform: string) => {
    const iconClass = "h-5 w-5";
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
      case 'published': return 'bg-success text-success-foreground';
      case 'scheduled': return 'bg-warning text-warning-foreground';
      case 'failed': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getPlatformIcon(post.platform)}
              <div>
                <DialogTitle className="capitalize">{post.platform} Post</DialogTitle>
                <DialogDescription>
                  Created {format(new Date(post.created_at), 'PPP')}
                </DialogDescription>
              </div>
            </div>
            <Badge className={getStatusColor(post.status)}>
              {post.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Scheduled for {format(new Date(post.scheduled_for), 'PPP')} at{' '}
                {format(new Date(post.scheduled_for), 'p')}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Content</h4>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{post.content}</p>
            </div>
          </div>

          {post.media_urls && post.media_urls.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Media ({post.media_urls.length})</h4>
              <div className="grid grid-cols-2 gap-2">
                {post.media_urls.map((url, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={url} 
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {post.external_post_id && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="h-4 w-4" />
              <span>External ID: {post.external_post_id}</span>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {post.status === 'scheduled' && onPublish && (
              <Button 
                onClick={() => {
                  onPublish(post.id);
                  onClose();
                }}
                variant="default"
              >
                Publish Now
              </Button>
            )}
            {onEdit && (
              <Button 
                onClick={() => {
                  onEdit(post.id);
                  onClose();
                }}
                variant="outline"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button 
                onClick={() => {
                  if (confirm('Are you sure you want to delete this post?')) {
                    onDelete(post.id);
                    onClose();
                  }
                }}
                variant="destructive"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostDetailsDialog;
