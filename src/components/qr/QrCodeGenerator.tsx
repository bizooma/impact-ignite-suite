import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Link, BarChart3 } from 'lucide-react';
import { QrShapePicker, type QrShape } from './QrShapePicker';

interface QrCodeGeneratorProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  createQrCode: (qrData: {
    name: string;
    destination_url: string;
    type?: 'static' | 'dynamic';
    brand_config?: any;
    utm_params?: any;
  }) => Promise<any>;
}

export const QrCodeGenerator: React.FC<QrCodeGeneratorProps> = ({
  open,
  onClose,
  organizationId,
  createQrCode
}) => {
  const [name, setName] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [type, setType] = useState<'static' | 'dynamic'>('dynamic');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [shape, setShape] = useState<QrShape>('square');
  const [logo, setLogo] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('qr_code');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !destinationUrl.trim()) return;

    setIsSubmitting(true);
    
    const brandConfig = {
      primaryColor,
      backgroundColor,
      shape,
      logo: logo || undefined
    };

    const utmParams = {
      utm_source: utmSource || undefined,
      utm_medium: utmMedium || undefined,
      utm_campaign: utmCampaign || undefined
    };

    await createQrCode({
      name: name.trim(),
      destination_url: destinationUrl.trim(),
      type,
      brand_config: brandConfig,
      utm_params: utmParams
    });

    // Reset form
    setName('');
    setDestinationUrl('');
    setType('dynamic');
    setPrimaryColor('#000000');
    setBackgroundColor('#ffffff');
    setShape('square');
    setLogo('');
    setUtmSource('');
    setUtmMedium('qr_code');
    setUtmCampaign('');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create QR Code</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">QR Code Name</Label>
              <Input
                id="name"
                placeholder="Enter a name for your QR code"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Destination URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">QR Code Type</Label>
              <Select value={type} onValueChange={(value: any) => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dynamic">
                    <div>
                      <div className="font-medium">Dynamic</div>
                      <div className="text-sm text-muted-foreground">Editable, trackable</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="static">
                    <div>
                      <div className="font-medium">Static</div>
                      <div className="text-sm text-muted-foreground">Fixed, no tracking</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="design" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="design">
                <Palette className="h-4 w-4 mr-2" />
                Design
              </TabsTrigger>
              <TabsTrigger value="tracking">
                <BarChart3 className="h-4 w-4 mr-2" />
                Tracking
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Link className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Visual Customization</CardTitle>
                  <CardDescription>Customize the appearance of your QR code</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-12 p-1 h-10"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backgroundColor">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="backgroundColor"
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-12 p-1 h-10"
                        />
                        <Input
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <QrShapePicker value={shape} onChange={setShape} />

                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo URL (Optional)</Label>
                    <Input
                      id="logo"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tracking" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">UTM Parameters</CardTitle>
                  <CardDescription>Add tracking parameters to monitor campaign performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="utmSource">UTM Source</Label>
                    <Input
                      id="utmSource"
                      placeholder="e.g., newsletter, social_media"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utmMedium">UTM Medium</Label>
                    <Input
                      id="utmMedium"
                      placeholder="e.g., qr_code"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utmCampaign">UTM Campaign</Label>
                    <Input
                      id="utmCampaign"
                      placeholder="e.g., summer_sale_2024"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">QR Code Preview</CardTitle>
                  <CardDescription>Preview how your QR code will look</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <div 
                    className="w-48 h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: backgroundColor,
                      color: primaryColor 
                    }}
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium mb-2">QR Code Preview</div>
                      <div className="text-xs text-muted-foreground">
                        Generated with {shape} shape
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{name || 'Untitled QR Code'}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                      {destinationUrl || 'No URL specified'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create QR Code'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};