import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Upload, X } from 'lucide-react';
import { useBrandKit } from '@/hooks/useBrandKit';
import { useOnboardingState } from '@/hooks/useOnboardingState';

interface BrandKitBannerProps {
  organizationId: string;
}

export function BrandKitBanner({ organizationId }: BrandKitBannerProps) {
  const { brandKit, isLoading } = useBrandKit(organizationId);
  const { state, dismissBanner } = useOnboardingState(organizationId);

  if (isLoading) return null;
  if (brandKit?.setup_completed_at) return null;
  if (state?.dismissed_banners?.brand_kit) return null;

  return (
    <Card className="border-primary/40 bg-gradient-to-r from-primary/10 to-accent/10 mb-6">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wide text-primary">Step 1</span>
                <span className="text-xs text-muted-foreground">Recommended first step</span>
              </div>
              <h3 className="font-semibold text-lg">Set up your Brand Kit</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Every app on the platform — chatbots, QR codes, social posts, campaigns — uses your brand kit so everything looks consistent. Build it manually or upload your existing brand guide PDF.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" asChild>
              <Link to="/dashboard/brand-kit?import=pdf">
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF
              </Link>
            </Button>
            <Button asChild>
              <Link to="/dashboard/brand-kit">
                <Palette className="h-4 w-4 mr-2" />
                Build it
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dismissBanner('brand_kit')}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
