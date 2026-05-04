import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { resolveBrandColors } from '@/lib/brandKit';
import { MessageCircle, QrCode, Heart } from 'lucide-react';
import type { BrandKit } from '@/types/brandKit';

interface BrandKitPreviewProps {
  draft: Partial<BrandKit>;
}

export function BrandKitPreview({ draft }: BrandKitPreviewProps) {
  const colors = resolveBrandColors(draft as BrandKit);
  const headingFont = draft.heading_font_family || 'Inter';
  const bodyFont = draft.body_font_family || 'Inter';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live preview</CardTitle>
        <CardDescription>How your brand will look across the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mock chatbot widget */}
          <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: colors.background }}>
            <div className="p-3 flex items-center gap-2" style={{ backgroundColor: colors.primary, color: 'white' }}>
              {draft.logo_mark_url ? (
                <img src={draft.logo_mark_url} alt="" className="h-6 w-6 rounded object-contain bg-white/20 p-0.5" />
              ) : (
                <MessageCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-semibold" style={{ fontFamily: `'${headingFont}', sans-serif` }}>
                Chat with us
              </span>
            </div>
            <div className="p-3 space-y-2 text-sm" style={{ color: colors.text, fontFamily: `'${bodyFont}', sans-serif` }}>
              <div className="rounded-lg p-2 inline-block" style={{ backgroundColor: colors.secondary + '20' }}>
                Hi! How can we help today?
              </div>
              <div className="text-right">
                <button
                  className="px-3 py-1.5 rounded text-xs font-semibold text-white"
                  style={{ backgroundColor: colors.accent }}
                >
                  Donate
                </button>
              </div>
            </div>
          </div>

          {/* Mock QR with logo */}
          <div className="border rounded-lg p-4 flex flex-col items-center justify-center" style={{ backgroundColor: colors.background }}>
            <div className="relative h-32 w-32 grid grid-cols-8 gap-px p-1 rounded" style={{ backgroundColor: colors.primary }}>
              {Array.from({ length: 64 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-sm"
                  style={{
                    backgroundColor: (i * 7 + 3) % 3 === 0 ? colors.background : colors.primary,
                  }}
                />
              ))}
              {draft.logo_mark_url && (
                <img
                  src={draft.logo_mark_url}
                  alt=""
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 object-contain bg-white p-0.5 rounded"
                />
              )}
            </div>
            <div
              className="text-xs mt-3"
              style={{ color: colors.text, fontFamily: `'${bodyFont}', sans-serif` }}
            >
              Sample QR code
            </div>
          </div>

          {/* Mock email/campaign header */}
          <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: colors.background }}>
            <div className="p-4" style={{ backgroundColor: colors.primary }}>
              {draft.logo_light_url || draft.logo_primary_url ? (
                <img
                  src={draft.logo_light_url || draft.logo_primary_url || ''}
                  alt=""
                  className="h-8 object-contain"
                />
              ) : (
                <div className="text-white font-bold" style={{ fontFamily: `'${headingFont}', sans-serif` }}>
                  Your Logo
                </div>
              )}
            </div>
            <div className="p-3 space-y-2">
              <h3
                className="text-base font-bold"
                style={{ color: colors.text, fontFamily: `'${headingFont}', sans-serif` }}
              >
                {draft.tagline || 'Make a difference today'}
              </h3>
              <p
                className="text-xs"
                style={{ color: colors.text, opacity: 0.8, fontFamily: `'${bodyFont}', sans-serif` }}
              >
                {draft.mission_statement || 'Your mission statement will appear here.'}
              </p>
              <button
                className="text-xs px-3 py-1.5 rounded font-semibold text-white flex items-center gap-1"
                style={{ backgroundColor: colors.accent }}
              >
                <Heart className="h-3 w-3" /> Get involved
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
