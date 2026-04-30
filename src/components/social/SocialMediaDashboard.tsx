import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { Calendar, Share2, Users, TrendingUp, Facebook, Twitter, Linkedin } from 'lucide-react';
import { toast } from 'sonner';
import { PostComposer } from './PostComposer';
import { CampaignManager } from './CampaignManager';
import SocialIntegrationsPanel from './SocialIntegrationsPanel';
import SocialCalendar from './SocialCalendar';
import PostDetailsDialog from './PostDetailsDialog';
import { AWARENESS_EVENTS } from '@/lib/campaignTemplates/awarenessCalendar';

interface SocialMediaDashboardProps {
  organizationId: string;
}

const SocialMediaDashboard: React.FC<SocialMediaDashboardProps> = ({ organizationId }) => {
  const { posts, campaigns, loading } = useSocialPosts(organizationId);
  const [showComposer, setShowComposer] = useState(false);
  const [composerInitialContent, setComposerInitialContent] = useState<string | undefined>();
  const [composerInitialDate, setComposerInitialDate] = useState<Date | undefined>();
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle return from Facebook / LinkedIn OAuth flows
  useEffect(() => {
    const fb = searchParams.get('fb');
    const li = searchParams.get('li');
    if (!fb && !li) return;
    if (fb === 'connected') {
      const pages = searchParams.get('pages');
      toast.success('Facebook connected', {
        description: pages
          ? `${pages} Page${pages === '1' ? '' : 's'} now available for publishing.`
          : 'Page is now available for publishing.',
      });
    } else if (fb === 'error') {
      const reason = searchParams.get('reason') ?? 'Unknown error';
      toast.error('Facebook connection failed', { description: reason });
    }
    if (li === 'connected') {
      const pages = searchParams.get('pages');
      toast.success('LinkedIn connected', {
        description: pages
          ? `${pages} Page${pages === '1' ? '' : 's'} now available for publishing.`
          : 'Page is now available for publishing.',
      });
    } else if (li === 'error') {
      const reason = searchParams.get('reason') ?? 'Unknown error';
      toast.error('LinkedIn connection failed', { description: reason });
    }
    const next = new URLSearchParams(searchParams);
    next.delete('fb');
    next.delete('li');
    next.delete('pages');
    next.delete('reason');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Handle ?compose=1&date=YYYY-MM-DD&awareness=<key> from awareness day popover
  useEffect(() => {
    if (searchParams.get('compose') !== '1') return;

    const dateStr = searchParams.get('date');
    const awarenessKey = searchParams.get('awareness');

    let initialDate: Date | undefined;
    if (dateStr) {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (y && m && d) initialDate = new Date(y, m - 1, d);
    }

    let initialContent: string | undefined;
    if (awarenessKey) {
      const event = AWARENESS_EVENTS.find((e) => e.key === awarenessKey);
      if (event) {
        const tag = '#' + event.name.replace(/[^a-zA-Z0-9]+/g, '');
        initialContent = `${event.name} — ${event.description}\n\n${tag} #Nonprofit`;
      }
    }

    setComposerInitialContent(initialContent);
    setComposerInitialDate(initialDate);
    setShowComposer(true);

    const next = new URLSearchParams(searchParams);
    next.delete('compose');
    next.delete('date');
    next.delete('awareness');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);


  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: Facebook },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
  ];

  const statuses = [
    { id: 'draft', name: 'Draft' },
    { id: 'scheduled', name: 'Scheduled' },
    { id: 'published', name: 'Published' },
    { id: 'failed', name: 'Failed' }
  ];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const toggleStatus = (statusId: string) => {
    setSelectedStatuses(prev =>
      prev.includes(statusId)
        ? prev.filter(s => s !== statusId)
        : [...prev, statusId]
    );
  };

  const clearFilters = () => {
    setSelectedPlatforms([]);
    setSelectedStatuses([]);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      default: return <Share2 className="h-4 w-4" />;
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

  const stats = {
    totalPosts: posts.length,
    publishedPosts: posts.filter(p => p.status === 'published').length,
    scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Social Media Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your social media presence across all platforms
          </p>
        </div>
        <Button onClick={() => setShowComposer(true)}>
          Create Post
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedPosts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledPosts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <SocialCalendar
                posts={posts}
                organizationId={organizationId}
                onPostClick={setSelectedPost}
                selectedPlatforms={selectedPlatforms}
                selectedStatuses={selectedStatuses}
              />
            </div>
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Platforms</h4>
                    <div className="space-y-2">
                      {platforms.map(platform => (
                        <div key={platform.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`platform-${platform.id}`}
                            checked={selectedPlatforms.includes(platform.id)}
                            onCheckedChange={() => togglePlatform(platform.id)}
                          />
                          <Label
                            htmlFor={`platform-${platform.id}`}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <platform.icon className="h-4 w-4" />
                            {platform.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3">Status</h4>
                    <div className="space-y-2">
                      {statuses.map(status => (
                        <div key={status.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status.id}`}
                            checked={selectedStatuses.includes(status.id)}
                            onCheckedChange={() => toggleStatus(status.id)}
                          />
                          <Label
                            htmlFor={`status-${status.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {status.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(selectedPlatforms.length > 0 || selectedStatuses.length > 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <div className="grid gap-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(post.platform)}
                      <div>
                        <CardTitle className="text-base capitalize">{post.platform}</CardTitle>
                        <CardDescription>
                          {post.scheduled_for 
                            ? `Scheduled for ${new Date(post.scheduled_for).toLocaleString()}`
                            : `Created ${new Date(post.created_at).toLocaleString()}`
                          }
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(post.status || 'draft')}>
                      {post.status || 'draft'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.content}
                  </p>
                  {post.media_urls && post.media_urls.length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      📎 {post.media_urls.length} media file(s) attached
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {posts.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first social media post to get started
                </p>
                <Button onClick={() => setShowComposer(true)}>
                  Create Post
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignManager organizationId={organizationId} campaigns={campaigns} />
        </TabsContent>

        <TabsContent value="integrations">
          <SocialIntegrationsPanel organizationId={organizationId} />
        </TabsContent>
      </Tabs>

      <PostComposer 
        open={showComposer}
        onClose={() => {
          setShowComposer(false);
          setComposerInitialContent(undefined);
          setComposerInitialDate(undefined);
        }}
        organizationId={organizationId}
        campaigns={campaigns}
        initialContent={composerInitialContent}
        initialDate={composerInitialDate}
      />

      <PostDetailsDialog
        post={selectedPost}
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </div>
  );
};

export default SocialMediaDashboard;