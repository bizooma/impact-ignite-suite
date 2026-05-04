import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useMarketingCampaignsList } from '@/hooks/useMarketingCampaignsList';


export type QrCodeRow = Database['public']['Tables']['qr_codes']['Row'];

interface QrSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  qrCode?: QrCodeRow;
  organizationId: string;
  updateQrCode: (id: string, updates: Partial<QrCodeRow>) => Promise<any>;
}

export const QrSettingsDialog: React.FC<QrSettingsDialogProps> = ({ open, onClose, qrCode, organizationId, updateQrCode }) => {
  const { toast } = useToast();
  const { data: marketingCampaigns } = useMarketingCampaignsList(organizationId);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [active, setActive] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [logoUrl, setLogoUrl] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [marketingCampaignId, setMarketingCampaignId] = useState<string>('none');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (qrCode) {
      setName(qrCode.name || '');
      setUrl(qrCode.destination_url || '');
      setActive(!!qrCode.is_active);
      const bc = (qrCode.brand_config as any) || {};
      setPrimaryColor(bc.primaryColor || '#000000');
      setBackgroundColor(bc.backgroundColor || '#FFFFFF');
      setLogoUrl(bc.logoUrl || '');
      const utm = (qrCode.utm_params as any) || {};
      setUtmSource(utm.utm_source || '');
      setUtmMedium(utm.utm_medium || '');
      setUtmCampaign(utm.utm_campaign || '');
      setUtmTerm(utm.utm_term || '');
      setUtmContent(utm.utm_content || '');
      setMarketingCampaignId((qrCode as any).marketing_campaign_id || 'none');
    }
  }, [qrCode]);

  const handleSave = async () => {
    if (!qrCode) return;
    setSaving(true);
    const utm_params: Record<string, string> = {};
    if (utmSource) utm_params.utm_source = utmSource;
    if (utmMedium) utm_params.utm_medium = utmMedium;
    if (utmCampaign) utm_params.utm_campaign = utmCampaign;
    if (utmTerm) utm_params.utm_term = utmTerm;
    if (utmContent) utm_params.utm_content = utmContent;

    const res = await updateQrCode(qrCode.id, {
      name,
      destination_url: url,
      is_active: active,
      brand_config: { primaryColor, backgroundColor, logoUrl } as any,
      utm_params: utm_params as any,
      marketing_campaign_id: marketingCampaignId === 'none' ? null : marketingCampaignId,
    } as Partial<QrCodeRow>);
    setSaving(false);
    if (res) {
      toast({
        title: 'Saved',
        description: 'QR code updated. Re-download to apply visual changes to printed codes.',
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit QR Code</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="qr-name">Name</Label>
              <Input id="qr-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-url">Destination URL</Label>
              <Input id="qr-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
              <p className="text-xs text-muted-foreground">
                Dynamic QR codes will redirect to this URL without re-printing.
              </p>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="qr-active">Active</Label>
                <p className="text-xs text-muted-foreground">Disabled codes will not redirect when scanned.</p>
              </div>
              <Switch id="qr-active" checked={active} onCheckedChange={setActive} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-campaign">Marketing campaign (optional)</Label>
              <Select value={marketingCampaignId} onValueChange={setMarketingCampaignId}>
                <SelectTrigger id="qr-campaign">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(marketingCampaigns || []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Attach this QR code to a campaign so its scans roll up into that campaign's analytics.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="design" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qr-color">Foreground Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="qr-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-16 p-1"
                  />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-bg">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="qr-bg"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-10 w-16 p-1"
                  />
                  <Input value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-logo">Logo URL (optional)</Label>
              <Input
                id="qr-logo"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://.../logo.png"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Visual changes only apply to newly downloaded QR images. Already-printed codes will keep their original look.
            </p>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utm-source">UTM Source</Label>
                <Input id="utm-source" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="newsletter" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm-medium">UTM Medium</Label>
                <Input id="utm-medium" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="qr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm-campaign">UTM Campaign</Label>
                <Input id="utm-campaign" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="spring-launch" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm-term">UTM Term</Label>
                <Input id="utm-term" value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="utm-content">UTM Content</Label>
                <Input id="utm-content" value={utmContent} onChange={(e) => setUtmContent(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              UTM parameters help track scan sources in your analytics tools.
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
