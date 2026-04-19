import { useParams, useNavigate } from 'react-router-dom';
import { useCampaign } from '@/hooks/useCampaigns';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { CampaignOverview } from '@/components/campaigns/CampaignOverview';
import { CampaignTimeline } from '@/components/campaigns/CampaignTimeline';
import { CampaignContentLibrary } from '@/components/campaigns/CampaignContentLibrary';
import { CampaignAudienceSelector } from '@/components/campaigns/CampaignAudienceSelector';
import { CampaignAnalytics } from '@/components/campaigns/CampaignAnalytics';

export default function CampaignDetail({ organizationId }: { organizationId: string }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: campaign, isLoading } = useCampaign(id!);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return <div className="text-center py-12 text-muted-foreground">Campaign not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/campaigns')} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> All campaigns
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            {campaign.event_date && (
              <p className="text-muted-foreground">
                Event: {(() => {
                  const [y, m, d] = campaign.event_date.split('-').map(Number);
                  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                })()}
              </p>
            )}
          </div>
          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className="capitalize">
            {campaign.status}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <CampaignOverview campaign={campaign} organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-4">
          <CampaignTimeline campaignId={campaign.id} />
        </TabsContent>
        <TabsContent value="content" className="mt-4">
          <CampaignContentLibrary campaignId={campaign.id} />
        </TabsContent>
        <TabsContent value="audience" className="mt-4">
          <CampaignAudienceSelector organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <CampaignAnalytics campaignId={campaign.id} organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
