import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import causeioLogo from "@/assets/causeio-logo.png";
import aiVideoMultichannelImage from "@/assets/blog/ai-video-multichannel-nonprofits.jpg";

const BlogPost = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      <SEOHead
        title="Harnessing AI, Video & the Multi-Channel Push: Big Digital Wins for Nonprofits in 2025 - Causeio Blog"
        description="2025 is shaping up to be a pivotal year for nonprofits that get serious about digital marketing. Learn about AI-driven personalization, short-form video, and multi-channel strategies."
        canonical="/blog/ai-video-multichannel-nonprofits-2025"
        keywords="nonprofit digital marketing 2025, AI for nonprofits, video marketing nonprofits, multi-channel marketing, nonprofit fundraising"
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
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
          
          <Badge variant="secondary" className="mb-4">
            AI & Automation
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Harnessing AI, Video & the Multi-Channel Push: Big Digital Wins for Nonprofits in 2025
          </h1>
          
          <div className="flex items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Joseph Murphy</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Sept. 15, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>8 min read</span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="mb-12 rounded-xl overflow-hidden">
          <img
            src={aiVideoMultichannelImage}
            alt="Digital marketing for nonprofits in 2025"
            className="w-full h-[400px] object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-muted-foreground mb-8">
            2025 is shaping up to be a pivotal year for nonprofits that get serious about digital marketing. With tighter budgets, higher donor expectations, and rapidly evolving tech, organizations that lean into new tactics now will have a significant competitive advantage. Here's a breakdown of three major shifts you should be monitoring — and implementing — right away.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6">Key Trends & What They Mean</h2>

          <h3 className="text-2xl font-bold mt-8 mb-4">1. AI-Driven Personalization & Automation</h3>
          <p className="mb-4">
            The use of artificial intelligence (AI) in nonprofit outreach and marketing is no longer a novelty. According to recent insights, nearly 30% of nonprofits say AI has boosted their fundraising revenue in the past year.
          </p>
          <p className="mb-4">
            <strong>What this means:</strong> you can use AI tools to segment donors more precisely, deliver personalised content (when a donor gives, when they volunteer, when they stop engaging), predict which donors are likely to lapse or upgrade, and automate repetitive outreach (e.g., welcome flows, thank-you emails).
          </p>
          <div className="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded-r-lg">
            <p className="font-semibold mb-2">Action tip:</p>
            <p>
              Identify a donor journey or email sequence that is currently manual (e.g., "first time donor → 3-month follow-up"). Map it out and explore how you can use automation + AI personalization (e.g., name, donation amount, interest area) to make it more efficient.
            </p>
          </div>

          <h3 className="text-2xl font-bold mt-8 mb-4">2. Short-Form Video & Multi-Channel Storytelling</h3>
          <p className="mb-4">
            Short-form video (think Reels, TikTok, YouTube Shorts) is now mainstream for nonprofits. A recent blog shows that in 2025 the "short-form video takes center stage" for storytelling and mobilization.
          </p>
          <p className="mb-4">
            <strong>Why it matters:</strong> Your audience increasingly wants quick, mobile-friendly content that shows impact — not just "here's our mission" but "here's what your donation did."
          </p>
          <div className="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded-r-lg">
            <p className="font-semibold mb-2">Action tip:</p>
            <p>
              Select one upcoming campaign (for example: volunteer recruitment or donation drive) and plan a 30-60 second video-clip for social media. Then repurpose it: full-length version for your website/newsletter, short version for social, text caption for email.
            </p>
          </div>

          <h3 className="text-2xl font-bold mt-8 mb-4">3. Multi-Channel Marketing & The Rise of "Surround Sound" Outreach</h3>
          <p className="mb-4">
            Nonprofits are moving beyond a single channel (email + website) toward a blend: SMS, direct mail, social, voice/assistant, etc. For example, one article highlights that nonprofits will increase "surround sound communication with SMS" to meet donors where they are.
          </p>
          <p className="mb-4">
            <strong>Why important:</strong> Donors and supporters interact across many devices and contexts. If you only email, you miss web, mobile, voice, social.
          </p>
          <div className="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded-r-lg">
            <p className="font-semibold mb-2">Action tip:</p>
            <p>
              Pick one under-used channel (e.g., SMS, voice-assistant, direct mail with QR). Run a pilot for one campaign to add that channel into your mix. Track incremental impact (open rate, click, donation) vs standard baseline.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-6">How to Get Started & Measure Success</h2>

          <p className="mb-4">
            <strong>Set clear objectives:</strong> Do you want to raise recurring donations? Increase volunteer sign-ups? Improve donor retention by X%? According to one guide, establishing measurable objectives aligned with organizational goals is essential.
          </p>

          <p className="mb-4">
            <strong>Map your donor/supporter journey:</strong> Where do people first engage (website, social post, event)? What asks are you making? What follow-up happens? Inject the new tactics (AI personalization, video, multi-channel) into the journey.
          </p>

          <p className="mb-4">
            <strong>Track the right metrics:</strong> Donor retention rate, average donation, recurring giving rate, video engagement (views, shares, completion), SMS click-through, channel cost per donor.
          </p>

          <p className="mb-4">
            <strong>Test & iterate:</strong> Try A/B versions of video-messaging, SMS vs email, AI-personalised vs generic. Make small bets, measure the lift, scale what works.
          </p>

          <p className="mb-4">
            <strong>Mind data ethics & privacy:</strong> With more personalization and automation comes more responsibility. Make sure you are transparent about how you use donor data, allow opt-outs, and guard privacy.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6">Why This Matters Now</h2>
          <p className="mb-4">
            Nonprofit audiences are more savvy; donors expect transparency, engagement, and convenience. Trends show increased investment in digital advertising (up 11% in 2024 vs 2023 for nonprofits) and a stronger focus on data-driven strategies.
          </p>
          <p className="mb-4">
            By adopting these tactics now (AI, video, multi-channel), your nonprofit will position itself for stronger engagement and funding, even in a more competitive philanthropic environment.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6">Closing</h2>
          <p className="mb-8">
            If you're running a nonprofit (or working with nonprofits via your NPO Bots SaaS, volunteer recruitment, corporate-sponsorship outreach), this is the moment to double-down on digital. Start small, move fast, measure well — and you'll see tangible results in 2025.
          </p>
        </div>

        {/* CTA Section */}
        <div className="mt-16 p-8 bg-primary/5 rounded-xl border border-primary/10">
          <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Nonprofit's Digital Presence?</h3>
          <p className="text-muted-foreground mb-6">
            Discover how Causeio can help you implement AI-driven automation, create engaging video content, and launch multi-channel campaigns that drive real results.
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

export default BlogPost;
