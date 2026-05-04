import { useState } from 'react';
import { useCrmDonorAnalytics, type DonorSegmentKey } from '@/hooks/useCrmDonorAnalytics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Loader2, ListPlus, ExternalLink } from 'lucide-react';
import { SUGGESTED_AUDIENCES } from '@/lib/campaignTemplates/givingTuesday';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Props {
  organizationId: string;
}

const SEGMENT_MAP: Record<string, DonorSegmentKey> = {
  lybunt: 'lybunt',
  sustaining: 'sustaining',
  new_donors: 'new_this_year',
  major_donors: 'major',
};

export function CampaignAudienceSelector({ organizationId }: Props) {
  const analytics = useCrmDonorAnalytics(organizationId);
  const navigate = useNavigate();
  const [busyKey, setBusyKey] = useState<string | null>(null);

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
      const { data: list, error: listErr } = await supabase
        .from('crm_lists')
        .insert({
          organization_id: organizationId,
          name: `${label} — ${new Date().toLocaleDateString()}`,
          description,
          list_type: 'static',
        })
        .select()
        .single();
      if (listErr) throw listErr;

      const rows = ids.map((cid: string) => ({ list_id: list.id, contact_id: cid }));
      const { error: memErr } = await supabase.from('crm_list_memberships').insert(rows);
      if (memErr) throw memErr;

      toast.success(`Created list with ${ids.length} contact${ids.length === 1 ? '' : 's'}`);
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
          Built live from your CRM. Create a saved list you can target with this campaign.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SUGGESTED_AUDIENCES.map((s) => {
          const count = counts[s.key] || 0;
          return (
            <Card key={s.key} className="p-4 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">{s.label}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                </div>
                <Badge variant="secondary" className="text-base">{count}</Badge>
              </div>
              <div className="flex gap-2 mt-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={busyKey === s.key || count === 0}
                  onClick={() => createListFromSegment(s.key, s.label, s.description)}
                >
                  {busyKey === s.key ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <ListPlus className="h-3.5 w-3.5 mr-1" />}
                  Create CRM list
                </Button>
                <Button size="sm" variant="ghost" onClick={() => navigate('/dashboard/crm?tab=lists')} title="View in CRM">
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
