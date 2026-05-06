import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { AccessibilityReviewPanel } from './AccessibilityReviewPanel';
import { scoreChecks, runChecks } from '@/lib/accessnotify/accessibilityReviewService';
import { logSend } from '@/lib/accessnotify/complianceLogService';
import { sendEmail } from '@/lib/accessnotify/emailNotificationService';
import { sendSms } from '@/lib/accessnotify/smsNotificationService';
import { placeVoiceCall } from '@/lib/accessnotify/voiceNotificationService';

const TYPES = [
  { value: 'event_reminder', label: 'Event reminder' },
  { value: 'donation_reminder', label: 'Donation reminder' },
  { value: 'volunteer_shift', label: 'Volunteer shift reminder' },
  { value: 'program_update', label: 'Program update' },
  { value: 'membership_renewal', label: 'Membership renewal' },
  { value: 'library_overdue', label: 'Library overdue notice' },
  { value: 'library_hold', label: 'Library hold ready notice' },
  { value: 'emergency_alert', label: 'Emergency / community alert' },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizationId: string;
  initial?: any;
}

export function CampaignBuilderDialog({ open, onOpenChange, organizationId, initial }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState('details');
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? 'program_update');
  const [channels, setChannels] = useState<string[]>(initial?.channels ?? ['email']);
  const [subject, setSubject] = useState(initial?.subject ?? '');
  const [emailBody, setEmailBody] = useState(initial?.email_body ?? '');
  const [smsBody, setSmsBody] = useState(initial?.sms_body ?? '');
  const [voiceScript, setVoiceScript] = useState(initial?.voice_script ?? '');
  const [plainBody, setPlainBody] = useState(initial?.plain_language_body ?? '');
  const [ctaUrl, setCtaUrl] = useState(initial?.cta_url ?? '');
  const [internalNotes, setInternalNotes] = useState(initial?.internal_notes ?? '');
  const [sendAt, setSendAt] = useState<string>('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const content = { subject, email_body: emailBody, sms_body: smsBody, voice_script: voiceScript, plain_language_body: plainBody };
  const checks = runChecks(content);
  const score = scoreChecks(checks);
  const hasWarnings = checks.some((c) => c.status !== 'pass');

  const toggleChannel = (c: string) => {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const reset = () => {
    setName(''); setType('program_update'); setChannels(['email']); setSubject(''); setEmailBody('');
    setSmsBody(''); setVoiceScript(''); setPlainBody(''); setCtaUrl(''); setInternalNotes('');
    setSendAt(''); setAcknowledged(false); setTab('details');
  };

  const save = async (status: 'draft' | 'sending') => {
    if (!name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    if (status === 'sending' && hasWarnings && !acknowledged) {
      toast({ title: 'Resolve warnings or acknowledge', variant: 'destructive' });
      setTab('review'); return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        organization_id: organizationId,
        name, type, channels, subject, email_body: emailBody, sms_body: smsBody,
        voice_script: voiceScript, plain_language_body: plainBody, cta_url: ctaUrl,
        internal_notes: internalNotes,
        send_at: sendAt ? new Date(sendAt).toISOString() : null,
        accessibility_acknowledged: acknowledged,
        status: status === 'sending' ? 'sent' : 'draft',
      };
      const { data: campaign, error } = await supabase
        .from('accessnotify_campaigns').insert(payload).select().single();
      if (error) throw error;

      if (status === 'sending' && campaign) {
        // Mock dispatch: send one log entry per selected channel as a demonstration
        for (const ch of channels) {
          let result;
          const recipientLabel = 'audience@example.org';
          if (ch === 'email') result = await sendEmail({ to: recipientLabel, subject: subject || name, html: emailBody });
          else if (ch === 'sms') result = await sendSms({ to: '+10000000000', body: smsBody });
          else result = await placeVoiceCall({ to: '+10000000000', script: voiceScript });

          await logSend({
            organization_id: organizationId,
            campaign_id: campaign.id,
            campaign_name: name,
            recipient_label: recipientLabel,
            channel: ch as any,
            delivery_status: result.status,
            accessibility_score: score,
            version_sent: ch === 'sms' ? 'sms' : ch === 'voice' ? 'voice' : 'full',
          });
        }
      }

      toast({ title: status === 'sending' ? 'Campaign sent' : 'Draft saved' });
      qc.invalidateQueries({ queryKey: ['accessnotify-campaigns', organizationId] });
      qc.invalidateQueries({ queryKey: ['accessnotify-logs', organizationId] });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New notification campaign</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="send">Send</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-4">
            <div>
              <Label>Campaign name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Spring fundraiser reminder" />
            </div>
            <div>
              <Label>Campaign type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Channels</Label>
              <div className="flex gap-4 mt-2">
                {['email', 'sms', 'voice'].map((c) => (
                  <label key={c} className="flex items-center gap-2 capitalize">
                    <Checkbox checked={channels.includes(c)} onCheckedChange={() => toggleChannel(c)} />
                    {c}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Internal notes</Label>
              <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={2} />
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4 pt-4">
            <div>
              <Label>Email subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <Label>Email body</Label>
              <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={6} />
            </div>
            <div>
              <Label>SMS version (160 chars recommended)</Label>
              <Textarea value={smsBody} onChange={(e) => setSmsBody(e.target.value)} rows={2} />
              <p className="text-xs text-muted-foreground mt-1">{smsBody.length} characters</p>
            </div>
            <div>
              <Label>Voice call script</Label>
              <Textarea value={voiceScript} onChange={(e) => setVoiceScript(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Plain-language version</Label>
              <Textarea value={plainBody} onChange={(e) => setPlainBody(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Call-to-action link</Label>
              <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://..." />
            </div>
          </TabsContent>

          <TabsContent value="review" className="pt-4">
            <AccessibilityReviewPanel
              campaign={content}
              onAcknowledge={() => setAcknowledged((v) => !v)}
              acknowledged={acknowledged}
              onRewrite={(t) => setEmailBody(t)}
            />
          </TabsContent>

          <TabsContent value="send" className="space-y-4 pt-4">
            <div>
              <Label>Schedule (leave empty to send now)</Label>
              <Input type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} />
            </div>
            <p className="text-sm text-muted-foreground">
              Sending will create compliance log entries for each channel. Real delivery is mocked in this build.
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => save('draft')} disabled={submitting}>Save draft</Button>
          <Button onClick={() => save('sending')} disabled={submitting}>
            {sendAt ? 'Schedule & log' : 'Send now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
