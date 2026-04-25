import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useOrganization } from '@/hooks/useOrganization';
import { CalendarIcon, Facebook, Twitter, Linkedin, AlertCircle, Upload, X, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { FacebookPreview } from './previews/FacebookPreview';

interface PostComposerProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  campaigns: any[];
}

export const PostComposer: React.FC<PostComposerProps> = ({
  open,
  onClose,
  organizationId,
  campaigns
}) => {
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState<'facebook' | 'linkedin' | 'twitter'>('facebook');
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('');
  const [campaignId, setCampaignId] = useState<string>('none');
  const [targetPageId, setTargetPageId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  const { createPost } = useSocialPosts(organizationId);
  const { integrations } = useIntegrations(organizationId);
  const { organization } = useOrganization();

  const isPlatformConnected = (platformName: string) => {
    return integrations.some(
      (i) => i.provider === platformName && i.status === 'active'
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > 5242880) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 5MB limit`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${organizationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('social-media-uploads')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('social-media-uploads')
          .getPublicUrl(fileName);

        newUrls.push(publicUrl);
      }

      setMediaUrls([...mediaUrls, ...newUrls]);
      toast({
        title: "Upload successful",
        description: `${newUrls.length} file(s) uploaded`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload media files",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    
    let scheduledFor: string | undefined;
    if (scheduledDate && scheduledTime) {
      const [hours, minutes] = scheduledTime.split(':');
      const scheduled = new Date(scheduledDate);
      scheduled.setHours(parseInt(hours), parseInt(minutes));
      scheduledFor = scheduled.toISOString();
    }

    await createPost({
      content: content.trim(),
      platform,
      scheduled_for: scheduledFor,
      campaign_id: campaignId === 'none' ? undefined : campaignId,
      media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
      target_page_id: (platform === 'facebook' || platform === 'linkedin') && targetPageId ? targetPageId : undefined,
    });

    setContent('');
    setScheduledDate(undefined);
    setScheduledTime('');
    setCampaignId('none');
    setMediaUrls([]);
    setIsSubmitting(false);
    onClose();
  };

  const getPlatformIcon = (platformName: string) => {
    switch (platformName) {
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      default: return null;
    }
  };

  const getCharacterLimit = (platformName: string) => {
    switch (platformName) {
      case 'twitter': return 280;
      case 'linkedin': return 3000;
      case 'facebook': return 63206;
      default: return 1000;
    }
  };

  const characterLimit = getCharacterLimit(platform);
  const remainingChars = characterLimit - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[1400px] max-h-[90vh] overflow-hidden p-0">
        <div className="grid md:grid-cols-2 gap-0 h-[85vh]">
          {/* Left Column - Composer */}
          <div className="p-6 overflow-y-auto border-r">
            <DialogHeader className="mb-4">
              <DialogTitle>Create Social Media Post</DialogTitle>
            </DialogHeader>
        
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isPlatformConnected(platform) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)} is not connected. 
                    Please connect your account in the Integrations tab before publishing.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={(value: any) => { setPlatform(value); setTargetPageId(''); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">
                      <div className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </div>
                    </SelectItem>
                    <SelectItem value="linkedin">
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </div>
                    </SelectItem>
                    <SelectItem value="twitter" disabled>
                      <div className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        Twitter / X
                        <span className="ml-2 text-xs rounded bg-muted px-1.5 py-0.5">Coming Soon</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* LinkedIn Page selector */}
              {platform === 'linkedin' && (() => {
                const liPages = integrations.filter(
                  (i) => i.provider === 'linkedin' && i.status === 'active'
                );
                if (liPages.length === 0) {
                  return (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No LinkedIn Page connected. Go to the Integrations tab and click "Connect LinkedIn" before publishing.
                      </AlertDescription>
                    </Alert>
                  );
                }
                if (liPages.length === 1) {
                  const cfg = (liPages[0].config ?? {}) as any;
                  const pageId = cfg.page_urn ?? cfg.page_id ?? '';
                  if (targetPageId !== pageId) setTargetPageId(pageId);
                  return (
                    <div className="text-sm text-muted-foreground">
                      Publishing to <span className="font-medium text-foreground">{cfg.page_name ?? 'LinkedIn Page'}</span>
                    </div>
                  );
                }
                const firstId = ((liPages[0].config as any)?.page_urn ?? (liPages[0].config as any)?.page_id ?? '');
                return (
                  <div className="space-y-2">
                    <Label htmlFor="target-page-li">LinkedIn Page</Label>
                    <Select
                      value={targetPageId || firstId}
                      onValueChange={setTargetPageId}
                    >
                      <SelectTrigger id="target-page-li">
                        <SelectValue placeholder="Select a Page" />
                      </SelectTrigger>
                      <SelectContent>
                        {liPages.map((i) => {
                          const cfg = (i.config ?? {}) as any;
                          const pageId = cfg.page_urn ?? cfg.page_id ?? i.id;
                          return (
                            <SelectItem key={i.id} value={pageId}>
                              {cfg.page_name ?? 'LinkedIn Page'}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })()}

              {/* Page selector — only show for Facebook when org has Pages connected */}
              {platform === 'facebook' && (() => {
                const fbPages = integrations.filter(
                  (i) => i.provider === 'facebook' && i.status === 'active'
                );
                if (fbPages.length === 0) {
                  return (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No Facebook Page connected. Go to the Integrations tab and click "Connect Facebook" before publishing.
                      </AlertDescription>
                    </Alert>
                  );
                }
                if (fbPages.length === 1) {
                  // Auto-select the single page; show as info only
                  const cfg = (fbPages[0].config ?? {}) as any;
                  if (targetPageId !== cfg.page_id) setTargetPageId(cfg.page_id);
                  return (
                    <div className="text-sm text-muted-foreground">
                      Publishing to <span className="font-medium text-foreground">{cfg.page_name}</span>
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    <Label htmlFor="target-page">Facebook Page</Label>
                    <Select
                      value={targetPageId || ((fbPages[0].config as any)?.page_id ?? '')}
                      onValueChange={setTargetPageId}
                    >
                      <SelectTrigger id="target-page">
                        <SelectValue placeholder="Select a Page" />
                      </SelectTrigger>
                      <SelectContent>
                        {fbPages.map((i) => {
                          const cfg = (i.config ?? {}) as any;
                          return (
                            <SelectItem key={i.id} value={cfg.page_id}>
                              {cfg.page_name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })()}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Content</Label>
                  <span className={cn(
                    "text-sm",
                    isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                  )}>
                    {remainingChars} / {characterLimit.toLocaleString()}
                  </span>
                </div>
                <Textarea
                  id="content"
                  placeholder="What's happening?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[180px] resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Media</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploadingFiles}
                      className="hidden"
                      id="media-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('media-upload')?.click()}
                      disabled={uploadingFiles}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingFiles ? "Uploading..." : "Upload Images"}
                    </Button>
                  </div>
                  
                  {mediaUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {mediaUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`Upload ${index + 1}`} 
                            className="w-full h-24 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeMedia(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Campaign (Optional)</Label>
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No campaign</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Schedule Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Schedule Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    disabled={!scheduledDate}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isOverLimit}>
                  {isSubmitting ? 'Creating...' : (scheduledDate ? 'Schedule Post' : 'Create Draft')}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column - Preview */}
          <div className="p-6 bg-muted/30 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Live Preview</h3>
                {platform && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {getPlatformIcon(platform)}
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </div>
                )}
              </div>

              {platform === 'facebook' && (
                <FacebookPreview
                  content={content}
                  mediaUrls={mediaUrls}
                  organizationName={organization?.name || "Organization"}
                  organizationLogo={organization?.logo_url}
                />
              )}

              {platform === 'twitter' && (
                <div className="p-8 rounded-lg border bg-background text-center">
                  <Twitter className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Twitter / X publishing coming soon
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
