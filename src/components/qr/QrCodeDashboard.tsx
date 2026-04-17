import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQrCodes } from '@/hooks/useQrCodes';
import { QrCode, Eye, Download, Settings, Plus, BarChart3 } from 'lucide-react';
import { QrCodeGenerator } from './QrCodeGenerator';
import { useToast } from '@/hooks/use-toast';
import { QrAnalyticsDialog } from './QrAnalyticsDialog';
import { QrSettingsDialog } from './QrSettingsDialog';
import { renderShapedQrPng } from '@/lib/qrShapeRenderer';

interface QrCodeDashboardProps {
  organizationId: string;
}

const QrPreview: React.FC<{ url: string; brandConfig?: any }> = ({ url, brandConfig }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    renderShapedQrPng({
      url,
      shape: brandConfig?.shape || 'square',
      primaryColor: brandConfig?.primaryColor || '#000000',
      backgroundColor: brandConfig?.backgroundColor || '#ffffff',
      size: 240,
    })
      .then((d) => { if (!cancelled) setQrDataUrl(d); })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [url, brandConfig]);

  if (!qrDataUrl) return <div className="w-20 h-20 bg-muted rounded animate-pulse" />;
  
  return (
    <div className="relative">
      <img src={qrDataUrl} alt="QR preview" className="w-20 h-20 rounded border border-border" />
      {brandConfig?.shape && brandConfig.shape !== 'square' && (
        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
          {brandConfig.shape}
        </div>
      )}
    </div>
  );
};

const QrCodeDashboard: React.FC<QrCodeDashboardProps> = ({ organizationId }) => {
  const [showGenerator, setShowGenerator] = useState(false);
  const { qrCodes, loading, createQrCode, updateQrCode } = useQrCodes(organizationId);
  const { toast } = useToast();
  const [analyticsQr, setAnalyticsQr] = useState<{ id: string; name: string } | null>(null);
  const [settingsQr, setSettingsQr] = useState<any | null>(null);
  const totalScans = qrCodes.reduce((sum, qr) => sum + ((qr as any).scan_count || 0), 0);
  const activeQrCodes = qrCodes.filter(qr => qr.is_active).length;

  const handleDownload = async (id: string, name: string, url?: string | null, brandConfig?: any) => {
    try {
      const dataUrl = await renderShapedQrPng({
        url: url || '',
        shape: brandConfig?.shape || 'square',
        primaryColor: brandConfig?.primaryColor || '#000000',
        backgroundColor: brandConfig?.backgroundColor || '#ffffff',
        size: 1024,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({ title: 'Downloaded', description: 'QR code image saved.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to generate QR image', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted animate-pulse rounded" />
                  <div className="h-3 bg-muted animate-pulse rounded w-4/5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">QR Code Dashboard</h2>
          <p className="text-muted-foreground">
            Create, manage, and track your QR codes
          </p>
        </div>
        <Button onClick={() => setShowGenerator(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create QR Code
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qrCodes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active QR Codes</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeQrCodes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScans}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Scans</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {qrCodes.length > 0 ? Math.round(totalScans / qrCodes.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {qrCodes.map((qrCode) => {
          const qrUrl = (qrCode as any).short_url || qrCode.destination_url;
          return (
            <Card key={qrCode.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <QrCode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <CardTitle className="text-lg truncate">{qrCode.name}</CardTitle>
                    </div>
                    <CardDescription>
                      Created {new Date(qrCode.created_at).toLocaleDateString()}
                    </CardDescription>
                    <Badge variant={qrCode.is_active ? "success" : "secondary"} className="mt-2">
                      {qrCode.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <QrPreview url={qrUrl} brandConfig={qrCode.brand_config} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <div className="font-medium mb-1">Destination URL</div>
                  <div className="text-muted-foreground truncate">{qrCode.destination_url}</div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{qrCode.type || 'dynamic'}</span>
                </div>

                {(qrCode.brand_config as any)?.shape && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Shape</span>
                    <span className="font-medium capitalize">{(qrCode.brand_config as any).shape}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Scans</span>
                  <span className="font-medium">{(qrCode as any).scan_count || 0}</span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(qrCode.id, qrCode.name, qrUrl, qrCode.brand_config)}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setAnalyticsQr({ id: qrCode.id, name: qrCode.name })}>
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analytics
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSettingsQr(qrCode)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {qrCodes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No QR codes yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first QR code to start tracking engagement
            </p>
            <Button onClick={() => setShowGenerator(true)}>
              Create QR Code
            </Button>
          </CardContent>
        </Card>
      )}

      <QrCodeGenerator 
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
        organizationId={organizationId}
        createQrCode={createQrCode}
      />

      <QrAnalyticsDialog
        open={!!analyticsQr}
        onClose={() => setAnalyticsQr(null)}
        qrCodeId={analyticsQr?.id}
        qrName={analyticsQr?.name}
      />

      <QrSettingsDialog
        open={!!settingsQr}
        onClose={() => setSettingsQr(null)}
        qrCode={settingsQr || undefined}
        organizationId={organizationId}
        updateQrCode={updateQrCode}
      />
    </div>
  );
};

export default QrCodeDashboard;