import { useCrmDonorAnalytics } from '@/hooks/useCrmDonorAnalytics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2 } from 'lucide-react';
import { SUGGESTED_AUDIENCES } from '@/lib/campaignTemplates/givingTuesday';

interface Props {
  organizationId: string;
}

export function CampaignAudienceSelector({ organizationId }: Props) {
  const analytics = useCrmDonorAnalytics(organizationId);

  if (analytics.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const segments = analytics.segments || ({} as any);

  const counts: Record<string, number> = {
    lybunt: segments.lybunt?.contactIds.length || 0,
    sustaining: segments.sustaining?.contactIds.length || 0,
    new_donors: segments.new_this_year?.contactIds.length || 0,
    major_donors: segments.major?.contactIds.length || 0,
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-1">Suggested audiences</h3>
        <p className="text-sm text-muted-foreground">
          Built live from your CRM. Use these to target outreach for this campaign.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SUGGESTED_AUDIENCES.map((s) => (
          <Card key={s.key} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">{s.label}</h4>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
              </div>
              <Badge variant="secondary" className="text-base">
                {counts[s.key] || 0}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
