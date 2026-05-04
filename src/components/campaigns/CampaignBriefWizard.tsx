import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Heart, Plus, Calendar, Loader2, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCampaignBrief, type CampaignObjective, type CampaignTone } from '@/hooks/useCampaignBrief';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { seedCampaignFromBrief } from '@/lib/campaignTemplates/genericSeeder';
import { formatLocalDate, getNextGivingTuesday } from '@/lib/campaignTemplates/givingTuesday';
import { AWARENESS_EVENTS, getNextOccurrence } from '@/lib/campaignTemplates/awarenessCalendar';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizationId: string;
}

type StartingPoint = 'blank' | 'giving_tuesday' | { kind: 'awareness'; key: string };

interface BriefDraft {
  name: string;
  objective: CampaignObjective;
  primary_goal_amount: string;
  primary_goal_donors: string;
  audience_description: string;
  key_message: string;
  tone: CampaignTone;
  call_to_action: string;
  landing_url: string;
  start_date: string;
  end_date: string;
  event_date: string;
  theme_color: string;
  channels: { social: boolean; email: boolean; sms: boolean; chatbot: boolean; qr: boolean; gbp: boolean };
}

const DEFAULT_DRAFT: BriefDraft = {
  name: '',
  objective: 'fundraise',
  primary_goal_amount: '',
  primary_goal_donors: '',
  audience_description: '',
  key_message: '',
  tone: 'warm',
  call_to_action: '',
  landing_url: '',
  start_date: '',
  end_date: '',
  event_date: '',
  theme_color: '#2E4F9E',
  channels: { social: true, email: true, sms: false, chatbot: true, qr: true, gbp: true },
};

export function CampaignBriefWizard({ open, onOpenChange, organizationId }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createCampaign, createFromGivingTuesday } = useCampaigns(organizationId);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [starting, setStarting] = useState<StartingPoint | null>(null);
  const [draft, setDraft] = useState<BriefDraft>(DEFAULT_DRAFT);
  const [busy, setBusy] = useState(false);
  const [skipSeeding, setSkipSeeding] = useState(false);

  const reset = () => {
    setStep(1);
    setStarting(null);
    setDraft(DEFAULT_DRAFT);
    setBusy(false);
    setSkipSeeding(false);
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const pickStarting = (s: StartingPoint) => {
    setStarting(s);
    if (s === 'giving_tuesday') {
      const gt = getNextGivingTuesday();
      const start = new Date(gt); start.setDate(gt.getDate() - 56);
      const end = new Date(gt); end.setDate(gt.getDate() + 14);
      setDraft({
        ...DEFAULT_DRAFT,
        name: `Giving Tuesday ${gt.getFullYear()}`,
        objective: 'fundraise',
        primary_goal_amount: '25000',
        primary_goal_donors: '100',
        key_message: 'One day. Endless impact.',
        tone: 'urgent',
        call_to_action: 'Give now',
        theme_color: '#dc2626',
        start_date: formatLocalDate(start),
        end_date: formatLocalDate(end),
        event_date: formatLocalDate(gt),
      });
    } else if (typeof s === 'object' && s.kind === 'awareness') {
      const ev = AWARENESS_EVENTS.find((e) => e.key === s.key);
      if (ev) {
        const date = getNextOccurrence(ev, new Date());
        const start = new Date(date); start.setDate(date.getDate() - 56);
        const end = new Date(date);
        if (ev.scope === 'month') end.setMonth(date.getMonth() + 1, 0);
        else end.setDate(date.getDate() + 7);
        setDraft({
          ...DEFAULT_DRAFT,
          name: `${ev.name} ${date.getFullYear()}`,
          objective: 'awareness',
          key_message: ev.description,
          tone: 'professional',
          theme_color: ev.color,
          start_date: formatLocalDate(start),
          end_date: formatLocalDate(end),
          event_date: formatLocalDate(date),
        });
      }
    }
    setStep(2);
  };

  const canAdvance = () => {
    return (
      draft.name.trim().length > 0 &&
      draft.audience_description.trim().length > 0 &&
      draft.key_message.trim().length > 0 &&
      draft.call_to_action.trim().length > 0 &&
      draft.event_date.length > 0
    );
  };

  const handleCreate = async () => {
    setBusy(true);
    try {
      // Special-case: full Giving Tuesday template uses richer hand-written content
      if (starting === 'giving_tuesday') {
        const c = await createFromGivingTuesday.mutateAsync({
          name: draft.name,
          goal_amount: Number(draft.primary_goal_amount) || undefined,
          goal_donors: Number(draft.primary_goal_donors) || undefined,
        });
        // Save the brief alongside as 'complete'
        await supabase.from('campaign_briefs').upsert({
          campaign_id: c.id,
          organization_id: organizationId,
          objective: draft.objective,
          primary_goal_amount: Number(draft.primary_goal_amount) || null,
          primary_goal_donors: Number(draft.primary_goal_donors) || null,
          audience_description: draft.audience_description,
          key_message: draft.key_message,
          tone: draft.tone,
          call_to_action: draft.call_to_action,
          landing_url: draft.landing_url || null,
          channels: draft.channels,
          start_date: draft.start_date || null,
          end_date: draft.end_date || null,
          event_date: draft.event_date || null,
          theme_color: draft.theme_color,
          status: 'complete',
          created_by: user?.id,
        } as any, { onConflict: 'campaign_id' });
        close();
        navigate(`/dashboard/campaigns/${c.id}`);
        return;
      }

      // Generic path: create the campaign, the brief, then seed milestones/assets/tasks from the brief
      const slug = `campaign-${Date.now().toString(36)}`;
      const campaign = await createCampaign.mutateAsync({
        name: draft.name,
        slug,
        template_key:
          typeof starting === 'object' && starting?.kind === 'awareness' ? starting.key : null,
        goal_amount: Number(draft.primary_goal_amount) || null,
        goal_donors: Number(draft.primary_goal_donors) || null,
        goal_currency: 'USD',
        start_date: draft.start_date || null,
        end_date: draft.end_date || null,
        event_date: draft.event_date || null,
        theme_color: draft.theme_color,
        tagline: draft.key_message,
        status: 'draft',
        channels: draft.channels,
      });

      await supabase.from('campaign_briefs').insert({
        campaign_id: campaign.id,
        organization_id: organizationId,
        objective: draft.objective,
        primary_goal_amount: Number(draft.primary_goal_amount) || null,
        primary_goal_donors: Number(draft.primary_goal_donors) || null,
        audience_description: draft.audience_description,
        key_message: draft.key_message,
        tone: draft.tone,
        call_to_action: draft.call_to_action,
        landing_url: draft.landing_url || null,
        channels: draft.channels,
        start_date: draft.start_date || null,
        end_date: draft.end_date || null,
        event_date: draft.event_date || null,
        theme_color: draft.theme_color,
        status: 'complete',
        created_by: user?.id,
      } as any);

      if (!skipSeeding) {
        await seedCampaignFromBrief({
          campaignId: campaign.id,
          organizationId,
          campaignName: draft.name,
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
        toast.success('Campaign created with timeline, content drafts, and tasks!');
      } else {
        toast.success('Campaign created. You can seed content later from the brief tab.');
      }
      close();
      navigate(`/dashboard/campaigns/${campaign.id}`);
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a campaign</DialogTitle>
          <DialogDescription>
            Step {step} of 3 — {step === 1 ? 'Choose a starting point' : step === 2 ? 'Fill out the creative brief' : 'Review & launch'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card
                onClick={() => pickStarting('giving_tuesday')}
                className="p-5 cursor-pointer hover:border-primary transition-all hover:shadow-md"
              >
                <Heart className="h-7 w-7 mb-2 text-red-600" />
                <h3 className="font-semibold">Giving Tuesday</h3>
                <p className="text-sm text-muted-foreground">Pre-built 8-week plan with hand-written copy.</p>
                <div className="text-xs text-primary mt-2">Recommended ⭐</div>
              </Card>
              <Card
                onClick={() => pickStarting('blank')}
                className="p-5 cursor-pointer hover:border-primary transition-all hover:shadow-md"
              >
                <Plus className="h-7 w-7 mb-2 text-muted-foreground" />
                <h3 className="font-semibold">Start from a blank brief</h3>
                <p className="text-sm text-muted-foreground">Define your own objective, audience, and message.</p>
              </Card>
            </div>

            <div>
              <div className="flex items-center gap-2 mt-4 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-sm">Or pick an awareness moment</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {AWARENESS_EVENTS.slice(0, 18).map((ev) => {
                  const date = getNextOccurrence(ev, new Date());
                  return (
                    <Card
                      key={ev.key}
                      onClick={() => pickStarting({ kind: 'awareness', key: ev.key })}
                      className="p-3 cursor-pointer hover:border-primary transition-all"
                      style={{ borderLeft: `3px solid ${ev.color}` }}
                    >
                      <div className="font-medium text-sm leading-tight">{ev.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label>Campaign name *</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Spring Appeal 2026" />
              </div>

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
                <Input type="number" value={draft.primary_goal_amount} onChange={(e) => setDraft({ ...draft, primary_goal_amount: e.target.value })} placeholder="25000" />
              </div>
              <div>
                <Label>Goal — donors / participants</Label>
                <Input type="number" value={draft.primary_goal_donors} onChange={(e) => setDraft({ ...draft, primary_goal_donors: e.target.value })} placeholder="100" />
              </div>

              <div className="md:col-span-2">
                <Label>Who are we talking to? *</Label>
                <Textarea
                  rows={2}
                  value={draft.audience_description}
                  onChange={(e) => setDraft({ ...draft, audience_description: e.target.value })}
                  placeholder="e.g. Past donors who haven't given this year, lapsed monthly donors, parents of program alumni…"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Key message *</Label>
                <Textarea
                  rows={2}
                  value={draft.key_message}
                  onChange={(e) => setDraft({ ...draft, key_message: e.target.value })}
                  placeholder="The one thing we want the audience to walk away with."
                />
              </div>

              <div>
                <Label>Call to action *</Label>
                <Input value={draft.call_to_action} onChange={(e) => setDraft({ ...draft, call_to_action: e.target.value })} placeholder="e.g. Give now, RSVP, Sign up" />
              </div>
              <div>
                <Label>Destination URL</Label>
                <Input value={draft.landing_url} onChange={(e) => setDraft({ ...draft, landing_url: e.target.value })} placeholder="https://…" />
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
                        onCheckedChange={(v) =>
                          setDraft({ ...draft, channels: { ...draft.channels, [ch]: !!v } })
                        }
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
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{draft.name}</h3>
                <Badge variant="outline" className="capitalize">{draft.objective.replace('_', ' ')}</Badge>
              </div>
              <p className="text-sm italic text-muted-foreground">"{draft.key_message}"</p>
              <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                <div><span className="text-muted-foreground">Audience:</span> {draft.audience_description}</div>
                <div><span className="text-muted-foreground">CTA:</span> {draft.call_to_action}</div>
                <div><span className="text-muted-foreground">Event:</span> {draft.event_date || '—'}</div>
                <div><span className="text-muted-foreground">Goal:</span> {draft.primary_goal_amount ? `$${draft.primary_goal_amount}` : '—'}</div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Channels:</span>{' '}
                  {Object.entries(draft.channels).filter(([, v]) => v).map(([k]) => k).join(', ')}
                </div>
              </div>
            </Card>
            <p className="text-sm text-muted-foreground">
              When you launch, we'll create the campaign, save your brief, and pre-build a 5-phase timeline, content drafts for each enabled channel, and a task checklist.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={() => (step === 1 ? close() : setStep((step - 1) as 1 | 2 | 3))}
            disabled={busy}
          >
            {step === 1 ? 'Cancel' : <><ArrowLeft className="h-4 w-4 mr-1" /> Back</>}
          </Button>
          {step < 3 && step > 1 && (
            <Button onClick={() => setStep(3)} disabled={!canAdvance()}>
              Continue <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleCreate} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Launch campaign
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
