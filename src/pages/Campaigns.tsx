import { CampaignDashboard } from '@/components/campaigns/CampaignDashboard';

export default function Campaigns({ organizationId }: { organizationId: string }) {
  return <CampaignDashboard organizationId={organizationId} />;
}
