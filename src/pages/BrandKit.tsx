import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrganization } from '@/hooks/useOrganization';
import { useBrandKit } from '@/hooks/useBrandKit';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Type, Image as ImageIcon, MessageSquare, Eye, Save, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { ColorsSection } from '@/components/brand-kit/ColorsSection';
import { TypographySection } from '@/components/brand-kit/TypographySection';
import { LogosSection } from '@/components/brand-kit/LogosSection';
import { VoiceSection } from '@/components/brand-kit/VoiceSection';
import { BrandKitPreview } from '@/components/brand-kit/BrandKitPreview';
import { PdfImportDialog } from '@/components/brand-kit/PdfImportDialog';
import { toast } from 'sonner';
import type { BrandKit } from '@/types/brandKit';

export default function BrandKit() {
  const { organization } = useOrganization();
  const orgId = organization?.id;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { brandKit, isLoading, upsert, isSaving, markCompleted } = useBrandKit(orgId);

  const [draft, setDraft] = useState<Partial<BrandKit>>({});
  const [dirty, setDirty] = useState(false);
  const [importOpen, setImportOpen] = useState(searchParams.get('import') === 'pdf');

  // Hydrate draft from server data when it arrives
  useEffect(() => {
    if (brandKit) {
      setDraft(brandKit);
      setDirty(false);
    }
  }, [brandKit?.id]);

  // Open the import dialog if ?import=pdf is in the URL
  useEffect(() => {
    if (searchParams.get('import') === 'pdf') setImportOpen(true);
  }, [searchParams]);

  const isComplete = !!brandKit?.setup_completed_at;

  const updateDraft = (patch: Partial<BrandKit>) => {
    setDraft(prev => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const handleSave = async (markComplete: boolean = false) => {
    if (!orgId) return;
    try {
      await upsert({ ...draft, organization_id: orgId });
      if (markComplete) {
        await markCompleted();
        toast.success('🎉 Brand Kit complete!', {
          description: 'Your colors, fonts, logos, and voice are now applied across every app — chatbots, QR codes, campaigns, and more.',
          duration: 8000,
          action: {
            label: 'Back to dashboard',
            onClick: () => navigate('/dashboard'),
          },
        });
      } else {
        toast.success('Brand kit saved');
      }
      setDirty(false);
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    }
  };

  const handleImportApplied = (applied: Partial<BrandKit>) => {
    setDraft(prev => ({ ...prev, ...applied }));
    setDirty(true);
    setImportOpen(false);
    // Clear the URL param so reopening the page doesn't re-trigger
    searchParams.delete('import');
    setSearchParams(searchParams, { replace: true });
    toast.success('Imported brand kit — review and save');
  };

  const completionScore = useMemo(() => {
    let score = 0;
    if (draft.primary_color) score++;
    if (draft.heading_font_family || draft.body_font_family) score++;
    if (draft.logo_primary_url || draft.logo_mark_url) score++;
    if (draft.tagline || draft.mission_statement) score++;
    return score;
  }, [draft]);

  if (!orgId || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Brand Kit</h1>
              <p className="text-muted-foreground">
                One source of truth for your colors, fonts, logos, and voice — applied across every app.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import from PDF
          </Button>
          {isComplete && (
            <span className="inline-flex items-center gap-1 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded">
              <CheckCircle2 className="h-4 w-4" /> Setup complete
            </span>
          )}
        </div>
      </div>

      {/* Progress card */}
      {!isComplete && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Brand kit setup · {completionScore} / 4 sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`h-1.5 rounded ${i < completionScore ? 'bg-primary' : 'bg-muted'}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Complete all four sections (Colors, Typography, Logos, Voice) and click "Save & finish setup" to apply your kit across the platform.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Builder sections */}
      <Tabs defaultValue="colors">
        <TabsList>
          <TabsTrigger value="colors"><Palette className="h-4 w-4 mr-1.5" /> Colors</TabsTrigger>
          <TabsTrigger value="typography"><Type className="h-4 w-4 mr-1.5" /> Typography</TabsTrigger>
          <TabsTrigger value="logos"><ImageIcon className="h-4 w-4 mr-1.5" /> Logos</TabsTrigger>
          <TabsTrigger value="voice"><MessageSquare className="h-4 w-4 mr-1.5" /> Voice</TabsTrigger>
          <TabsTrigger value="preview"><Eye className="h-4 w-4 mr-1.5" /> Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-4">
          <ColorsSection draft={draft} onChange={updateDraft} />
        </TabsContent>
        <TabsContent value="typography" className="mt-4">
          <TypographySection draft={draft} onChange={updateDraft} />
        </TabsContent>
        <TabsContent value="logos" className="mt-4">
          <LogosSection draft={draft} onChange={updateDraft} organizationId={orgId} />
        </TabsContent>
        <TabsContent value="voice" className="mt-4">
          <VoiceSection draft={draft} onChange={updateDraft} />
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <BrandKitPreview draft={draft} />
        </TabsContent>
      </Tabs>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-background/95 backdrop-blur border-t z-30">
        <div className="px-6 py-3 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {dirty ? 'You have unsaved changes' : isComplete ? 'All changes saved' : 'No changes yet'}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
            <Button variant="secondary" onClick={() => handleSave(false)} disabled={isSaving || !dirty}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save draft
            </Button>
            {!isComplete && (
              <Button onClick={() => handleSave(true)} disabled={isSaving || completionScore < 2}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save & finish setup
              </Button>
            )}
          </div>
        </div>
      </div>

      <PdfImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        organizationId={orgId}
        onApplied={handleImportApplied}
      />
    </div>
  );
}
