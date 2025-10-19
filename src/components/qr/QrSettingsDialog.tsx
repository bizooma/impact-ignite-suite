import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useQrCodes } from '@/hooks/useQrCodes';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

export type QrCodeRow = Database['public']['Tables']['qr_codes']['Row'];

interface QrSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  qrCode?: QrCodeRow;
  organizationId: string;
}

export const QrSettingsDialog: React.FC<QrSettingsDialogProps> = ({ open, onClose, qrCode, organizationId }) => {
  const { updateQrCode } = useQrCodes(organizationId);
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (qrCode) {
      setName(qrCode.name || '');
      setUrl(qrCode.destination_url || '');
      setActive(!!qrCode.is_active);
    }
  }, [qrCode]);

  const handleSave = async () => {
    if (!qrCode) return;
    const res = await updateQrCode(qrCode.id, {
      name,
      destination_url: url,
      is_active: active,
    } as Partial<QrCodeRow>);
    if (res) {
      toast({ title: 'Saved', description: 'QR code updated' });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qr-name">Name</Label>
            <Input id="qr-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qr-url">Destination URL</Label>
            <Input id="qr-url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="qr-active">Active</Label>
            <Switch id="qr-active" checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
