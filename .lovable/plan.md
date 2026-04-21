

## Goal
Add a new blog post: **"QR Codes for Nonprofits: Best Practices to Boost Donations, Events & Engagement in 2025"** — matching the existing blog style and wired into the blog index.

## What Will Be Built

**1. New page component** — `src/pages/BlogPostQrCodesNonprofits.tsx`
Follows the exact pattern of `BlogPostGoogleGrants.tsx` and `BlogPostVolunteerRecruitment.tsx`:
- `SEOHead` with title, description, canonical URL, keywords
- Sticky top nav (Causeio logo + "Back to Home")
- Article header: category badge ("Marketing"), author (Joseph Murphy), date (Nov. 1, 2025), read time (~7 min)
- Featured image (see asset note below)
- Structured content: intro + 6 numbered best-practice sections, each with an "✅ Action Tip" callout
- CTA section linking to `/auth`
- Footer with copyright

**2. Content outline (6 best practices)**
1. Place QR codes where supporters already are (event signage, direct mail, bulletins, merch)
2. Always link to a mobile-optimized landing page (not your homepage)
3. Use dynamic QR codes so you can update destinations without reprinting
4. Track every scan with UTM parameters to measure campaign ROI
5. Brand your QR codes (colors, logo, shape) so they feel trustworthy
6. Pair QR codes with a clear call-to-action ("Scan to donate $25 today")
- Closing: how Causeio's QR module handles all of this in one place

**3. Featured image** — `src/assets/blog/qr-codes-nonprofits.jpg`
Generated illustration showing a nonprofit volunteer/event scene with a phone scanning a branded QR code. Matches the warm, mission-driven aesthetic of the other blog images.

**4. Route registration** — `src/App.tsx`
Add: `<Route path="/blog/qr-codes-nonprofits-2025" element={<BlogPostQrCodesNonprofits />} />`

**5. Blog index update** — `src/pages/Blog.tsx`
Append a 4th entry to the `blogPosts` array with the new image, title, excerpt, slug, and metadata so it appears in the grid.

**6. Landing page blog section** — `src/components/landing/BlogSection.tsx`
Add the new post to its sample data so it surfaces on the homepage too (keeps the 3 most recent if grid is capped).

**7. Sitemap** — `public/sitemap.xml`
Add `<url>` entry for `/blog/qr-codes-nonprofits-2025` for SEO indexing.

## Out of Scope
- No CMS — stays static per existing blog architecture (per project memory).
- No changes to QR code product features themselves.
- No new analytics events.

## Technical Notes
- Reuses `SEOHead`, `Button`, `Badge`, Lucide icons — no new dependencies.
- Image generated to match existing blog asset style (warm tones, real-world nonprofit context).
- SEO keywords target: "QR codes for nonprofits", "nonprofit QR code donations", "fundraising QR codes 2025".

