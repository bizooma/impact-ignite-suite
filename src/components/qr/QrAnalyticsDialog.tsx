import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useQrCodes } from '@/hooks/useQrCodes';
import type { Database } from '@/integrations/supabase/types';

type QrScan = Database['public']['Tables']['qr_scans']['Row'];

interface QrAnalyticsDialogProps {
  open: boolean;
  onClose: () => void;
  qrCodeId?: string;
  qrName?: string;
}

export const QrAnalyticsDialog: React.FC<QrAnalyticsDialogProps> = ({ open, onClose, qrCodeId, qrName }) => {
  const { getQrScans } = useQrCodes();
  const [loading, setLoading] = useState(false);
  const [scans, setScans] = useState<QrScan[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!open || !qrCodeId) return;
      setLoading(true);
      try {
        const data = await getQrScans(qrCodeId);
        if (mounted) setScans(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, qrCodeId]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>QR Analytics</DialogTitle>
          <DialogDescription>
            Recent scans for {qrName || 'QR Code'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <div className="text-2xl font-semibold">{loading ? '—' : scans.length}</div>
          <Badge variant="secondary">Total scans</Badge>
        </div>
        <Separator className="my-3" />

        <ScrollArea className="h-64 pr-2">
          {loading && <div className="text-sm text-muted-foreground">Loading scans…</div>}
          {!loading && scans.length === 0 && (
            <div className="text-sm text-muted-foreground">No scans yet.</div>
          )}
          {!loading && scans.map((s) => (
            <div key={s.id} className="py-2">
              <div className="text-sm font-medium">
                {new Date(s.scanned_at).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {s.referrer || 'Direct'} • {s.user_agent?.slice(0, 60)}
              </div>
            </div>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
