import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCrmDonorAnalytics, type DonorSegmentKey } from '@/hooks/useCrmDonorAnalytics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Loader2, ListPlus, ExternalLink, Check } from 'lucide-react';
import { SUGGESTED_AUDIENCES } from '@/lib/campaignTemplates/givingTuesday';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Props {
  organizationId: string;
  campaignId?: string;
}

const SEGMENT_MAP: Record<string, DonorSegmentKey> = {
  lybunt: 'lybunt',
  sustaining: 'sustaining',
  new_donors: 'new_this_year',
  major_donors: 'major',
};

interface AttachedListInfo {
  segment_key: string;
  list_id: string;
  list_name: string;
  count: number;
  attached_at: string;
}

export function CampaignAudienceSelector({ organizationId, campaignId }: Props) {
  const analytics = useCrmDonorAnalytics(organizationId);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Load existing brief link state when in a campaign context
  const { data: brief } = useQuery({
    queryKey: ['campaign-brief-segments', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const { data } = await supabase
        .from('campaign_briefs')
        .select('id, audience_segments')
        .eq('campaign_id', campaignId)
        .maybeSingle();
      return data;
    },
    enabled: !!campaignId,
  });

  const attachedBySegment: Record<string, AttachedListInfo> = {};
  if (Array.isArray(brief?.audience_segments)) {
    for (const entry of brief.audience_segments as any[]) {
      if (entry?.segment_key && entry?.list_id) attachedBySegment[entry.segment_key] = entry;
    }
  }

  if (analytics.isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const segments = analytics.segments || ({} as any);

  const counts: Record<string, number> = {
    lybunt: segments.lybunt?.contactIds.length || 0,
    sustaining: segments.sustaining?.contactIds.length || 0,
    new_donors: segments.new_this_year?.contactIds.length || 0,
    major_donors: segments.major?.contactIds.length || 0,
  };

  const createListFromSegment = async (segmentKey: string, label: string, description: string) => {
    const mapped = SEGMENT_MAP[segmentKey];
    const ids = segments[mapped]?.contactIds || [];
    if (ids.length === 0) {
      toast.error('This segment has no contacts yet.');
      return;
    }
    setBusyKey(segmentKey);
    try {
      const listName = `${label}${campaignId ? '' : ` — ${new Date().toLocaleDateString()}`}`;
      const { data: list, error: listErr } = await supabase
        .from('crm_lists')
        .insert({
          organization_id: organizationId,
          name: listName,
          description,
          list_type: 'static',
        })
        .select()
        .single();
      if (listErr) throw listErr;

      const rows = ids.map((cid: string) => ({ list_id: list.id, contact_id: cid }));
      const { error: memErr } = await supabase.from('crm_list_memberships').insert(rows);
      if (memErr) throw memErr;

      // If we're inside a campaign, attach this list to the brief.audience_segments
      if (campaignId && brief?.id) {
        const existing = Array.isArray(brief.audience_segments) ? (brief.audience_segments as any[]) : [];
        const next = [
          ...existing.filter((e) => e?.segment_key !== segmentKey),
          {
            segment_key: segmentKey,
            list_id: list.id,
            list_name: listName,
            count: ids.length,
            attached_at: new Date().toISOString(),
          },
        ];
        await supabase.from('campaign_briefs').update({ audience_segments: next as any }).eq('id', brief.id);
        qc.invalidateQueries({ queryKey: ['campaign-brief-segments', campaignId] });
        qc.invalidateQueries({ queryKey: ['campaign-brief', campaignId] });
      }

      toast.success(`Created list with ${ids.length} contact${ids.length === 1 ? '' : 's'}${campaignId ? ' and attached to this campaign' : ''}`);
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-1">Suggested audiences</h3>
        <p className="text-sm text-muted-foreground">
          Built live from your CRM. {campaignId ? 'Create a saved list and attach it to this campaign.' : 'Create a saved list you can target with a campaign.'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SUGGESTED_AUDIENCES.map((s) => {
          const count = counts[s.key] || 0;
          const attached = attachedBySegment[s.key];
          return (
            <Card key={s.key} className="p-4 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">{s.label}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                  {attached && (
                    <Badge variant="default" className="mt-2 text-xs gap-1">
                      <Check className="h-3 w-3" />
                      Attached · {attached.count} contacts
                    </Badge>
                  )}
                </div>
                <Badge variant="secondary" className="text-base">{count}</Badge>
              </div>
              <div className="flex gap-2 mt-auto">
                <Button
                  size="sm"
                  variant={attached ? 'secondary' : 'outline'}
                  className="flex-1"
                  disabled={busyKey === s.key || count === 0}
                  onClick={() => createListFromSegment(s.key, s.label, s.description)}
                >
                  {busyKey === s.key ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <ListPlus className="h-3.5 w-3.5 mr-1" />
                  )}
                  {attached ? 'Refresh list' : 'Create CRM list'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    attached
                      ? navigate(`/dashboard/crm?tab=lists&list=${attached.list_id}`)
                      : navigate('/dashboard/crm?tab=lists')
                  }
                  title={attached ? 'View list' : 'Open lists'}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
