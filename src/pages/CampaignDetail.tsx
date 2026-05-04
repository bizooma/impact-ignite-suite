import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { BriefSummaryTab } from '@/components/campaigns/BriefSummaryTab';
import givingTuesdayLogo from '@/assets/giving-tuesday-logo.png';

export default function CampaignDetail({ organizationId }: { organizationId: string }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'brief';
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

  const isGivingTuesday = campaign.template_key === 'giving_tuesday';

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/campaigns')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> All campaigns
      </Button>

      {isGivingTuesday ? (
        <div
          className="relative overflow-hidden rounded-xl px-8 py-10 md:px-12 md:py-14"
          style={{ backgroundColor: '#2E4F9E' }}
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,white,transparent_50%)]" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <img
                src={givingTuesdayLogo}
                alt="Giving Tuesday"
                className="h-20 md:h-24 w-auto drop-shadow-md"
              />
              <div className="text-white">
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">{campaign.name}</h1>
                {campaign.event_date && (
                  <p className="text-white/80 text-sm md:text-base mt-1">
                    {(() => {
                      const [y, m, d] = campaign.event_date.split('-').map(Number);
                      return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                    })()}
                  </p>
                )}
                {campaign.tagline && (
                  <p className="text-white/90 italic mt-2 text-sm md:text-base">"{campaign.tagline}"</p>
                )}
              </div>
            </div>
            <Badge
              variant="secondary"
              className="capitalize self-start md:self-center bg-white/15 text-white border-white/20 hover:bg-white/20"
            >
              {campaign.status}
            </Badge>
          </div>
        </div>
      ) : (
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
      )}

      <Tabs
        value={initialTab}
        onValueChange={(v) => {
          const next = new URLSearchParams(searchParams);
          next.set('tab', v);
          setSearchParams(next, { replace: true });
        }}
      >
        <TabsList>
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="brief" className="mt-4">
          <BriefSummaryTab campaignId={campaign.id} organizationId={organizationId} />
        </TabsContent>
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
          <CampaignAudienceSelector organizationId={organizationId} campaignId={campaign.id} />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <CampaignAnalytics campaignId={campaign.id} organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
