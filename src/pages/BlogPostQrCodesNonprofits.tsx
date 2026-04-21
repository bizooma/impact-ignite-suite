import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import causeioLogo from "@/assets/causeio-logo.png";
import qrCodesImage from "@/assets/blog/qr-codes-nonprofits.jpg";

const BlogPostQrCodesNonprofits = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      <SEOHead
        title="QR Codes for Nonprofits: Best Practices to Boost Donations, Events & Engagement in 2025 - Causeio Blog"
        description="Learn how nonprofits can use QR codes to drive donations, fill events, and engage supporters. 6 proven best practices for fundraising QR codes in 2025."
        canonical="/blog/qr-codes-nonprofits-2025"
        keywords="QR codes for nonprofits, nonprofit QR code donations, fundraising QR codes 2025, dynamic QR codes, donation QR code, nonprofit marketing"
      />

      {/* Navigation */}
      <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img src={causeioLogo} alt="Causeio - Where Purpose Meets Performance" className="h-12" />
          </Link>
          <Link to="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Article Header */}
      <article className="w-full max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link to="/blog">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          <Badge variant="secondary" className="mb-4">
            Marketing
          </Badge>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            QR Codes for Nonprofits: Best Practices to Boost Donations, Events & Engagement in 2025
          </h1>

          <div className="flex items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Joseph Murphy</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Nov. 1, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>7 min read</span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="mb-12 rounded-xl overflow-hidden">
          <img
            src={qrCodesImage}
            alt="Nonprofit volunteer holding a QR code while a supporter scans it with a smartphone at a charity event"
            width={1280}
            height={720}
            className="w-full h-[400px] object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <h2 className="text-3xl font-bold mt-8 mb-6">Introduction</h2>
          <p className="mb-4">
            QR codes have quietly become one of the highest-ROI tools in a nonprofit's marketing kit. They cost almost nothing to produce, work on every modern smartphone, and turn passive moments — a glance at a flyer, a pause at an event table, a paragraph in a direct-mail letter — into an instant action. But most nonprofits still use QR codes as an afterthought: pasted on a poster, pointing at a homepage, with no tracking and no follow-up.
          </p>
          <p className="mb-4">
            In 2025, the organizations winning new donors and volunteers are treating QR codes like real campaign assets. Here are six best practices to make sure every scan moves your mission forward.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6">1. Place QR Codes Where Supporters Already Are</h2>
          <p className="mb-4">
            A QR code only works if people see it in the right moment. Think about where your supporters already pay attention — and meet them there:
          </p>
          <ul className="space-y-2 mb-4">
            <li><strong>Event signage:</strong> banners, table tents, name badges, stage screens.</li>
            <li><strong>Direct mail & appeal letters:</strong> next to the donation ask, not buried in a footer.</li>
            <li><strong>Bulletins, programs & newsletters:</strong> printed pieces are the perfect QR home.</li>
            <li><strong>Merch & vehicle decals:</strong> t-shirts, tote bags, van wraps, yard signs.</li>
            <li><strong>Receipts & thank-you cards:</strong> turn a "thanks" into a follow-up action.</li>
          </ul>
          <div className="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded-r-lg">
            <p className="font-semibold mb-2">✅ Action Tip:</p>
            <p>
              Audit every printed piece your nonprofit produces this quarter. If it doesn't have a QR code with a clear next step, it's leaving conversions on the table.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-6">2. Always Link to a Mobile-Optimized Landing Page</h2>
          <p className="mb-4">
            The #1 mistake nonprofits make is sending QR scans to the homepage. A homepage is a menu — and a scanner is already past the menu. They want the thing.
          </p>
          <p className="mb-4">
            Build a dedicated landing page for each campaign that:
          </p>
          <ul className="space-y-2 mb-4">
            <li>Loads in under 3 seconds on mobile.</li>
            <li>Has a single, obvious call-to-action above the fold.</li>
            <li>Uses large tap targets and minimal form fields.</li>
            <li>Matches the visual brand of the printed piece they just scanned.</li>
          </ul>
          <div className="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded-r-lg">
            <p className="font-semibold mb-2">✅ Action Tip:</p>
            <p>
              Run your landing page through Google's PageSpeed Insights. Anything under 80 on mobile is costing you donors before they ever see your story.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-6">3. Use Dynamic QR Codes — Not Static Ones</h2>
          <p className="mb-4">
            A static QR code permanently encodes a URL. Once printed on 5,000 brochures, you can never change it. A dynamic QR code points to a short redirect URL that you control — meaning you can update the destination, fix typos, or repurpose the campaign without reprinting a single thing.
          </p>
          <p className="mb-4">
            Dynamic codes also unlock real analytics: scan counts, timestamps, location, and device type — the data you need to prove ROI to your board.
          </p>
          <div className="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded-r-lg">
            <p className="font-semibold mb-2">✅ Action Tip:</p>
            <p>
              Never print a static QR code on anything that costs more than $50 to produce. The flexibility of a dynamic code pays for itself the first time a URL needs to change.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-6">4. Track Every Scan With UTM Parameters</h2>
          <p className="mb-4">
            Even with a dynamic QR code, you should layer on UTM parameters so scans show up clearly in Google Analytics and your CRM. A simple tagging convention:
          </p>
          <ul className="space-y-2 mb-4">
            <li><strong>utm_source:</strong> qr</li>
            <li><strong>utm_medium:</strong> print, signage, mail, merch</li>
            <li><strong>utm_campaign:</strong> giving-tuesday-2025, gala-table-tent, fall-appeal</li>
          </ul>
          <p className="mb-4">
            With this in place, you can finally answer questions like: "Did the gala signage drive more donations than the mailer?" — and budget accordingly next year.
          </p>
          <div className="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded-r-lg">
            <p className="font-semibold mb-2">✅ Action Tip:</p>
            <p>
              Standardize a UTM naming guide across your team. Inconsistent tagging is the #1 reason nonprofit analytics dashboards become unreadable.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-6">5. Brand Your QR Codes So They Feel Trustworthy</h2>
          <p className="mb-4">
            A plain black-and-white QR code looks generic — and in a world of phishing scams, generic feels risky. Branded QR codes get scanned more because they signal legitimacy.
          </p>
          <p className="mb-4">
            Best practices for branded codes:
          </p>
          <ul className="space-y-2 mb-4">
            <li>Use your brand colors (with enough contrast — aim for 40%+).</li>
            <li>Drop your logo or icon in the center.</li>
            <li>Try rounded modules or a custom frame to match your aesthetic.</li>
            <li>Test scan reliability on multiple devices before printing.</li>
          </ul>
          <div className="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded-r-lg">
            <p className="font-semibold mb-2">✅ Action Tip:</p>
            <p>
              Always test a printed proof from across the room — not just on your monitor. Cameras need physical contrast, and a beautiful design that won't scan is just expensive ink.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-6">6. Pair Every QR Code With a Clear Call-to-Action</h2>
          <p className="mb-4">
            A QR code by itself is a question mark. People need a reason to lift their phone. The CTA next to the code is what closes that gap.
          </p>
          <p className="mb-4">
            Strong CTAs are specific and benefit-led:
          </p>
          <ul className="space-y-2 mb-4">
            <li>"Scan to donate $25 — feeds a family for a week."</li>
            <li>"Scan to RSVP to our Spring Gala in 30 seconds."</li>
            <li>"Scan to sign up for next Saturday's volunteer shift."</li>
            <li>"Scan to watch Maria's story (90 seconds)."</li>
          </ul>
          <p className="mb-4">
            Avoid vague prompts like "Learn more" or "Visit our site" — they don't justify the friction of pulling out a phone.
          </p>
          <div className="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded-r-lg">
            <p className="font-semibold mb-2">✅ Action Tip:</p>
            <p>
              Run an A/B test on two versions of the same printed piece — one with a vague CTA, one with a specific dollar-amount or time-bound CTA. The lift is almost always significant.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-6">Closing</h2>
          <p className="mb-4">
            QR codes aren't a gimmick — they're the shortest distance between an offline moment and an online action. Done right, they turn every flyer, sign, and t-shirt into a measurable fundraising channel.
          </p>
          <p className="mb-8">
            Causeio's QR module handles all of this in one place: dynamic codes, branded designs, automatic UTM tagging, and a real-time scan dashboard wired directly to your CRM. So when a donor scans a code at your gala, you don't just see the gift — you see the journey.
          </p>
        </div>

        {/* CTA Section */}
        <div className="mt-16 p-8 bg-primary/5 rounded-xl border border-primary/10">
          <h3 className="text-2xl font-bold mb-4">Ready to Turn Every Scan Into Impact?</h3>
          <p className="text-muted-foreground mb-6">
            Generate branded, trackable QR codes in minutes with Causeio. Built for nonprofits, wired to your CRM, and designed to make every printed piece pull its weight.
          </p>
          <Link to="/auth">
            <Button size="lg">
              Get Started Today
            </Button>
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="w-full border-t bg-muted/50 py-12 px-6 mt-20">
        <div className="w-full max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">
            &copy; 2025 Causeio, A <a href="https://bizooma.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">Bizooma, LLC</a> Company | All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BlogPostQrCodesNonprofits;
