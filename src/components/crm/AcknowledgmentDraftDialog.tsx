import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useBrandKit } from '@/hooks/useBrandKit';
import type { CrmContact } from '@/hooks/useCrm';
import type { CrmDonation } from '@/hooks/useCrmDonations';

interface Props {
  open: boolean;
  onClose: () => void;
  donation: CrmDonation;
  contact: CrmContact;
  organizationName: string;
  onMarkSent?: () => void;
}

export function AcknowledgmentDraftDialog({ open, onClose, donation, contact, organizationName, onMarkSent }: Props) {
  const { brandKit } = useBrandKit(contact.organization_id);

  const donorFirst = contact.first_name || contact.organization_name || 'Friend';
  const fullName = contact.contact_type === 'organization'
    ? contact.organization_name || 'Friend'
    : `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Friend';
  const amount = `$${Number(donation.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const dateStr = format(new Date(donation.donation_date), 'MMMM d, yyyy');

  // Tone-aware opening + closing pulled from brand kit voice descriptors.
  const voice = useMemo(() => {
    const descriptors = (brandKit?.voice_descriptors || []).map(v => v.toLowerCase());
    const has = (k: string) => descriptors.some(d => d.includes(k));
    let opener = `Thank you so much for your generous gift of ${amount} on ${dateStr}.`;
    let middle = `Your support directly fuels our mission and makes our work possible.\n\nBecause of supporters like you, we are able to continue serving our community with care and dedication. We are deeply grateful for your partnership.`;
    let signoff = 'With sincere thanks';
    if (has('warm') || has('friendly') || has('caring')) {
      opener = `What a gift — thank you so much for your ${amount} contribution on ${dateStr}. It truly means the world to us.`;
      signoff = 'With heartfelt thanks';
    } else if (has('bold') || has('confident') || has('inspiring')) {
      opener = `Your ${amount} gift on ${dateStr} is moving the mission forward — thank you.`;
      middle = `This is the kind of support that turns ambition into action. With partners like you, we're not just imagining a better tomorrow — we're building it.`;
      signoff = 'Onward, together';
    } else if (has('professional') || has('formal')) {
      opener = `On behalf of ${organizationName}, thank you for your contribution of ${amount} received on ${dateStr}.`;
      signoff = 'Sincerely';
    } else if (has('playful') || has('fun')) {
      opener = `Holy moly — thank you for the wonderful ${amount} gift on ${dateStr}! 🙌`;
      middle = `Gifts like yours keep the lights on, the volunteers fed, and the impact growing. We're so glad you're in our corner.`;
      signoff = 'With huge gratitude';
    }
    const tagline = brandKit?.tagline?.trim();
    const ps = tagline ? `\n\nP.S. ${tagline}` : '';
    return { opener, middle, signoff, ps };
  }, [brandKit, amount, dateStr, organizationName]);

  const defaultSubject = `Thank you for your generous gift to ${organizationName}`;
  const defaultBody = `Dear ${donorFirst},

${voice.opener}

${voice.middle}

For your records: ${organizationName} is a tax-exempt organization. No goods or services were provided in exchange for this contribution. Please retain this acknowledgment for your tax records.

${voice.signoff},
The ${organizationName} Team${voice.ps}`;

  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  useEffect(() => {
    if (open) {
      setSubject(defaultSubject);
      setBody(defaultBody);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, donation.id, brandKit?.id]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy');
    }
  };

  const openMailto = () => {
    if (!contact.email) {
      toast.error('No email on file for this contact');
      return;
    }
    const url = `mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thank-you email draft for {fullName}</DialogTitle>
          {brandKit?.voice_descriptors && brandKit.voice_descriptors.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Brand voice
              </Badge>
              <span className="text-xs text-muted-foreground">
                Tone adapted from your brand kit: {brandKit.voice_descriptors.slice(0, 3).join(', ')}
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="ack-to">To</Label>
            <div className="flex gap-2">
              <Input id="ack-to" value={contact.email || '(no email on file)'} readOnly />
              <Button type="button" variant="outline" size="icon" onClick={() => contact.email && copy(contact.email, 'Email address')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ack-subject">Subject</Label>
            <div className="flex gap-2">
              <Input id="ack-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <Button type="button" variant="outline" size="icon" onClick={() => copy(subject, 'Subject')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ack-body">Message</Label>
            <Textarea
              id="ack-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
          <Button variant="outline" onClick={() => copy(body, 'Message')}>
            <Copy className="h-4 w-4 mr-2" /> Copy message
          </Button>
          <Button variant="outline" onClick={openMailto} disabled={!contact.email}>
            <ExternalLink className="h-4 w-4 mr-2" /> Open in email app
          </Button>
          {onMarkSent && (
            <Button onClick={onMarkSent}>
              <Check className="h-4 w-4 mr-2" /> Mark as acknowledged
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
