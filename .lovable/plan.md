

# Landing Page Redesign -- Warm & Mission-Driven

## Current Issues
- Dense, repetitive card grid (12 product cards all look the same with background images behind overlays -- hard to scan)
- Hero section is basic text over a photo with a generic badge
- Beta signup form feels disconnected from the hero
- Sections blend together with no visual rhythm
- Testimonials are plain cards with no personality
- "Why Choose Causeio" section uses generic SaaS claims (SOC 2, 99.9% uptime) that don't match the nonprofit audience
- Footer links point to `#` (dead links)

## Redesign Approach

### 1. Hero Section -- Emotionally Engaging
- Remove the parallax background image and dark overlay
- Use a warm gradient background (teal-to-white) with the Causeio logo prominently placed
- Larger, more human headline: keep the mission language but make it warmer
- Embed the beta signup form directly in the hero (side-by-side on desktop: headline left, form right) instead of having it in a separate section below
- Remove the generic "rocket emoji" badge

### 2. Social Proof Strip
- Add a thin strip below the hero with trust indicators: "Built for nonprofits", "12 tools in one platform", "Free beta access"
- Simple icons + text, no cards

### 3. Product Features -- Grouped & Scannable
- Instead of 12 identical cards, group products into 3-4 categories with a visual distinction:
  - **Engage**: Chatbots, CRM, Mobile App
  - **Promote**: Social Media, QR Codes, SEO, Google Business, PPC (coming soon)
  - **Operate**: Tasks, Analytics, Integrations, Website Builder (coming soon)
- Each category gets a heading, brief description, and a horizontal row of compact feature tiles (icon + name + one-liner)
- "Coming Soon" items get a subtle badge, not a separate card style
- Remove background images from cards -- use clean icons on light tinted backgrounds instead

### 4. How It Works -- 3-Step Visual
- New section: "Get Started in Minutes"
- Three numbered steps with icons: Sign Up -> Build Your Tools -> Amplify Your Mission
- Horizontal layout on desktop, vertical on mobile

### 5. Testimonials -- Warmer Design
- Add a soft tinted background section
- Use larger quote marks, warmer card styling with a left accent border in primary color
- Keep the existing 3 testimonials

### 6. Why Causeio -- Mission-Aligned
- Rewrite the benefits to focus on nonprofit outcomes instead of generic SaaS claims:
  - "Save Staff Time" instead of "Lightning Fast"
  - "Nonprofit-Friendly Pricing" instead of "Enterprise Security"
  - "Built for Your Mission" instead of "Expert Support"
- Replace the "10x Faster Growth" stat block with 3 smaller stat cards (e.g., "12 Tools", "24/7 Chatbot Support", "Free Beta Access")

### 7. Blog Section -- Keep As-Is
- Already working well, no changes needed

### 8. FAQ -- Minor Polish
- Reduce from 10 to 6-7 most important questions
- Add slightly more padding and a subtle card wrapper

### 9. CTA Section -- Warmer Tone
- Change dark slate background to a warm primary gradient
- Keep the Calendly link

### 10. Footer -- Fix Dead Links
- Point footer links to actual routes (`/blog`, `/pricing`) or remove dead ones
- Keep the Bizooma attribution

## Technical Details

**Files modified:**
- `src/pages/Landing.tsx` -- Complete rewrite of the JSX structure and layout. Keep all imports, schemas, and logic. Reorganize sections as described above.
- `src/components/landing/BetaSignupForm.tsx` -- Minor styling tweaks to work within the hero layout (make it more compact, remove the outer Card wrapper when embedded in hero)
- `src/index.css` -- No changes needed; existing color system works well for warm/mission-driven

**No new files or dependencies needed.** All product background image imports can be removed since we're switching to clean icon-based cards.

