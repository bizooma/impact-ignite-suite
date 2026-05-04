import { useState } from 'react';
import { useCampaignBrief } from '@/hooks/useCampaignBrief';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Edit2, X } from 'lucide-react';
import { BriefForm } from './BriefForm';

interface Props {
  campaignId: string;
  organizationId: string;
}

const OBJECTIVE_LABEL: Record<string, string> = {
  fundraise: 'Raise funds',
  awareness: 'Build awareness',
  recruit_volunteers: 'Recruit volunteers',
  event_attendance: 'Drive event attendance',
  advocacy: 'Advocacy / take action',
  stewardship: 'Donor stewardship',
};

export function BriefSummaryTab({ campaignId, organizationId }: Props) {
  const { brief, isLoading } = useCampaignBrief(campaignId);
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!brief) {
    return (
      <Card className="p-6 space-y-4">
        <div className="text-center pb-2 border-b">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Add a creative brief</h3>
          <p className="text-sm text-muted-foreground">
            This campaign was created before briefs were required. Fill it in to unlock content seeding and analytics.
          </p>
        </div>
        <BriefForm campaignId={campaignId} organizationId={organizationId} initial={null} showSeedOption />
      </Card>
    );
  }

  if (editing) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Edit brief</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
        </div>
        <BriefForm
          campaignId={campaignId}
          organizationId={organizationId}
          initial={brief}
          showSeedOption={brief.status !== 'complete'}
          onSaved={() => setEditing(false)}
        />
      </Card>
    );
  }

  const channels = Object.entries((brief.channels || {}) as Record<string, boolean>)
    .filter(([, v]) => v)
    .map(([k]) => (k === 'gbp' ? 'Google Business' : k));

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge>{OBJECTIVE_LABEL[brief.objective] || brief.objective}</Badge>
            <Badge variant="outline" className="capitalize">{brief.tone} tone</Badge>
            <Badge variant={brief.status === 'complete' ? 'default' : 'secondary'} className="capitalize">
              {brief.status}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        </div>
        {brief.key_message && (
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Key message</div>
            <p className="text-base font-medium mt-1">{brief.key_message}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <Field label="Audience" value={brief.audience_description} />
          <Field label="Call to action" value={brief.call_to_action} />
          <Field label="Destination URL" value={brief.landing_url} mono />
          <Field
            label="Goal"
            value={
              brief.primary_goal_amount
                ? `$${Number(brief.primary_goal_amount).toLocaleString()}${brief.primary_goal_donors ? ` · ${brief.primary_goal_donors} donors` : ''}`
                : brief.primary_goal_donors
                ? `${brief.primary_goal_donors} donors`
                : null
            }
          />
          <Field label="Start date" value={brief.start_date} />
          <Field label="Event date" value={brief.event_date} />
          <Field label="Channels" value={channels.join(', ')} />
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`mt-1 text-sm ${mono ? 'font-mono break-all' : ''}`}>{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}
