import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { POPULAR_GOOGLE_FONTS, googleFontUrl, loadFontStylesheet } from '@/lib/brandKit';
import type { BrandKit } from '@/types/brandKit';

interface TypographySectionProps {
  draft: Partial<BrandKit>;
  onChange: (patch: Partial<BrandKit>) => void;
}

export function TypographySection({ draft, onChange }: TypographySectionProps) {
  const headingFont = draft.heading_font_family || '';
  const bodyFont = draft.body_font_family || '';

  // Preload selected fonts into the iframe so the live preview renders correctly
  useMemo(() => {
    if (headingFont) loadFontStylesheet(googleFontUrl(headingFont));
    if (bodyFont) loadFontStylesheet(googleFontUrl(bodyFont));
  }, [headingFont, bodyFont]);

  const setHeadingFont = (family: string) => {
    onChange({
      heading_font_family: family,
      heading_font_url: googleFontUrl(family),
      heading_font_weight: draft.heading_font_weight || '700',
    });
  };

  const setBodyFont = (family: string) => {
    onChange({
      body_font_family: family,
      body_font_url: googleFontUrl(family),
      body_font_weight: draft.body_font_weight || '400',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Typography</CardTitle>
        <CardDescription>
          Choose Google Fonts for your headings and body text. They'll load automatically across every app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Heading font</Label>
            <Select value={headingFont} onValueChange={setHeadingFont}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a font" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {POPULAR_GOOGLE_FONTS.map(f => (
                  <SelectItem key={f} value={f} style={{ fontFamily: `'${f}', sans-serif` }}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {headingFont && (
              <div
                className="mt-3 p-3 rounded border bg-muted/30"
                style={{ fontFamily: `'${headingFont}', sans-serif`, fontWeight: 700 }}
              >
                <div className="text-2xl">The quick brown fox</div>
                <div className="text-sm text-muted-foreground mt-1">Heading preview · 700</div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Body font</Label>
            <Select value={bodyFont} onValueChange={setBodyFont}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a font" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {POPULAR_GOOGLE_FONTS.map(f => (
                  <SelectItem key={f} value={f} style={{ fontFamily: `'${f}', sans-serif` }}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {bodyFont && (
              <div
                className="mt-3 p-3 rounded border bg-muted/30"
                style={{ fontFamily: `'${bodyFont}', sans-serif`, fontWeight: 400 }}
              >
                <div className="text-base">
                  Pack my box with five dozen liquor jugs. Every cause has a story worth telling.
                </div>
                <div className="text-sm text-muted-foreground mt-1">Body preview · 400</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
