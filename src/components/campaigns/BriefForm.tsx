import { useState, useEffect } from 'react';
import { useCampaignBrief, type CampaignBrief, type CampaignObjective, type CampaignTone } from '@/hooks/useCampaignBrief';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { seedCampaignFromBrief } from '@/lib/campaignTemplates/genericSeeder';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  campaignId: string;
  organizationId: string;
  initial?: CampaignBrief | null;
  onSaved?: () => void;
  showSeedOption?: boolean;
}

export function BriefForm({ campaignId, organizationId, initial, onSaved, showSeedOption }: Props) {
  const { user } = useAuth();
  const { upsertBrief } = useCampaignBrief(campaignId);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [seedContent, setSeedContent] = useState(false);

  const [draft, setDraft] = useState({
    objective: (initial?.objective || 'fundraise') as CampaignObjective,
    tone: (initial?.tone || 'warm') as CampaignTone,
    primary_goal_amount: initial?.primary_goal_amount?.toString() || '',
    primary_goal_donors: initial?.primary_goal_donors?.toString() || '',
    audience_description: initial?.audience_description || '',
    key_message: initial?.key_message || '',
    call_to_action: initial?.call_to_action || '',
    landing_url: initial?.landing_url || '',
    start_date: initial?.start_date || '',
    end_date: initial?.end_date || '',
    event_date: initial?.event_date || '',
    theme_color: initial?.theme_color || '#2E4F9E',
    channels:
      (initial?.channels as any) || { social: true, email: true, sms: false, chatbot: true, qr: true, gbp: true },
  });

  useEffect(() => {
    if (initial) {
      setDraft({
        objective: initial.objective,
        tone: initial.tone,
        primary_goal_amount: initial.primary_goal_amount?.toString() || '',
        primary_goal_donors: initial.primary_goal_donors?.toString() || '',
        audience_description: initial.audience_description || '',
        key_message: initial.key_message || '',
        call_to_action: initial.call_to_action || '',
        landing_url: initial.landing_url || '',
        start_date: initial.start_date || '',
        end_date: initial.end_date || '',
        event_date: initial.event_date || '',
        theme_color: initial.theme_color || '#2E4F9E',
        channels: (initial.channels as any) || { social: true, email: true, sms: false, chatbot: true, qr: true, gbp: true },
      });
    }
  }, [initial?.id]);

  const valid =
    draft.audience_description.trim().length > 0 &&
    draft.key_message.trim().length > 0 &&
    draft.call_to_action.trim().length > 0 &&
    draft.event_date.length > 0;

  const save = async () => {
    if (!valid) {
      toast.error('Fill out audience, key message, call to action, and event date.');
      return;
    }
    setBusy(true);
    try {
      const wasIncomplete = !initial || initial.status !== 'complete';
      await upsertBrief.mutateAsync({
        campaign_id: campaignId,
        organization_id: organizationId,
        objective: draft.objective,
        tone: draft.tone,
        primary_goal_amount: Number(draft.primary_goal_amount) || null,
        primary_goal_donors: Number(draft.primary_goal_donors) || null,
        audience_description: draft.audience_description,
        key_message: draft.key_message,
        call_to_action: draft.call_to_action,
        landing_url: draft.landing_url || null,
        channels: draft.channels,
        start_date: draft.start_date || null,
        end_date: draft.end_date || null,
        event_date: draft.event_date || null,
        theme_color: draft.theme_color,
        status: 'complete',
        completed_at: new Date().toISOString(),
        ...(initial?.id ? {} : { created_by: user?.id }),
      } as any);

      // Backfill name/event_date/tagline/theme onto the campaign so cards reflect it
      await supabase
        .from('marketing_campaigns')
        .update({
          event_date: draft.event_date || null,
          start_date: draft.start_date || null,
          end_date: draft.end_date || null,
          tagline: draft.key_message,
          theme_color: draft.theme_color,
          goal_amount: Number(draft.primary_goal_amount) || null,
          goal_donors: Number(draft.primary_goal_donors) || null,
        })
        .eq('id', campaignId);

      if (wasIncomplete && (showSeedOption ? seedContent : false)) {
        const { data: campaign } = await supabase
          .from('marketing_campaigns')
          .select('name')
          .eq('id', campaignId)
          .single();
        await seedCampaignFromBrief({
          campaignId,
          organizationId,
          campaignName: campaign?.name || 'Campaign',
          brief: {
            objective: draft.objective,
            tone: draft.tone,
            key_message: draft.key_message,
            call_to_action: draft.call_to_action,
            landing_url: draft.landing_url,
            channels: draft.channels,
            event_date: draft.event_date,
            start_date: draft.start_date,
            end_date: draft.end_date,
          },
          createdBy: user?.id || null,
        });
        toast.success('Brief saved and content drafts seeded.');
      } else {
        toast.success('Brief saved');
      }

      qc.invalidateQueries({ queryKey: ['campaign-dashboard-stats', organizationId] });
      qc.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      qc.invalidateQueries({ queryKey: ['campaign-milestones', campaignId] });
      qc.invalidateQueries({ queryKey: ['campaign-assets', campaignId] });
      onSaved?.();
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Primary objective *</Label>
          <Select value={draft.objective} onValueChange={(v) => setDraft({ ...draft, objective: v as CampaignObjective })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fundraise">Raise funds</SelectItem>
              <SelectItem value="awareness">Build awareness</SelectItem>
              <SelectItem value="recruit_volunteers">Recruit volunteers</SelectItem>
              <SelectItem value="event_attendance">Drive event attendance</SelectItem>
              <SelectItem value="advocacy">Advocacy / take action</SelectItem>
              <SelectItem value="stewardship">Donor stewardship</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tone</Label>
          <Select value={draft.tone} onValueChange={(v) => setDraft({ ...draft, tone: v as CampaignTone })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="celebratory">Celebratory</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="playful">Playful</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Goal — amount (USD)</Label>
          <Input type="number" value={draft.primary_goal_amount} onChange={(e) => setDraft({ ...draft, primary_goal_amount: e.target.value })} />
        </div>
        <div>
          <Label>Goal — donors / participants</Label>
          <Input type="number" value={draft.primary_goal_donors} onChange={(e) => setDraft({ ...draft, primary_goal_donors: e.target.value })} />
        </div>

        <div className="md:col-span-2">
          <Label>Who are we talking to? *</Label>
          <Textarea rows={2} value={draft.audience_description} onChange={(e) => setDraft({ ...draft, audience_description: e.target.value })} />
        </div>

        <div className="md:col-span-2">
          <Label>Key message *</Label>
          <Textarea rows={2} value={draft.key_message} onChange={(e) => setDraft({ ...draft, key_message: e.target.value })} />
        </div>

        <div>
          <Label>Call to action *</Label>
          <Input value={draft.call_to_action} onChange={(e) => setDraft({ ...draft, call_to_action: e.target.value })} />
        </div>
        <div>
          <Label>Destination URL</Label>
          <Input value={draft.landing_url} onChange={(e) => setDraft({ ...draft, landing_url: e.target.value })} />
        </div>

        <div>
          <Label>Start date</Label>
          <Input type="date" value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} />
        </div>
        <div>
          <Label>Event / culmination date *</Label>
          <Input type="date" value={draft.event_date} onChange={(e) => setDraft({ ...draft, event_date: e.target.value })} />
        </div>

        <div className="md:col-span-2">
          <Label className="mb-2 block">Channels</Label>
          <div className="flex flex-wrap gap-3">
            {(['social', 'email', 'sms', 'chatbot', 'qr', 'gbp'] as const).map((ch) => (
              <label key={ch} className="flex items-center gap-2 text-sm capitalize cursor-pointer">
                <Checkbox
                  checked={draft.channels[ch]}
                  onCheckedChange={(v) => setDraft({ ...draft, channels: { ...draft.channels, [ch]: !!v } })}
                />
                {ch === 'gbp' ? 'Google Business' : ch}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label>Theme color</Label>
          <Input type="color" value={draft.theme_color} onChange={(e) => setDraft({ ...draft, theme_color: e.target.value })} className="h-10 w-20 p-1" />
        </div>
      </div>

      {showSeedOption && (!initial || initial.status !== 'complete') && (
        <label className="flex items-start gap-2 text-sm cursor-pointer rounded-md border p-3 bg-muted/30">
          <Checkbox checked={seedContent} onCheckedChange={(v) => setSeedContent(!!v)} className="mt-0.5" />
          <span>
            <span className="font-medium">Generate timeline, content drafts, and tasks from this brief.</span>
            <span className="block text-muted-foreground mt-0.5">
              Recommended for legacy campaigns that have no milestones or content yet.
            </span>
          </span>
        </label>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={busy || !valid}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {initial?.status === 'complete' ? 'Save changes' : 'Save brief'}
        </Button>
      </div>
    </div>
  );
}
