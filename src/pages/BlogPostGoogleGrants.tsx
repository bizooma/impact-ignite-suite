import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import causeioLogo from "@/assets/causeio-logo.png";
import googleAdGrantsImage from "@/assets/blog/google-ad-grants-nonprofits.jpg";

const BlogPostGoogleGrants = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      <SEOHead
        title="Making Google Ad Grants Work for You: How Nonprofits Can Turn Free Ad Dollars into Real Impact in 2025 - Causeio Blog"
        description="Google's Ad Grants program gives nonprofits up to $10,000 per month in free search ads. Learn how to maximize your grant, stay compliant, and boost your impact in 2025."
        canonical="/blog/google-ad-grants-nonprofits-2025"
        keywords="Google Ad Grants, nonprofit advertising, free Google Ads, nonprofit marketing 2025, digital advertising for nonprofits"
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
            Marketing
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Making Google Ad Grants Work for You: How Nonprofits Can Turn Free Ad Dollars into Real Impact in 2025
          </h1>
          
          <div className="flex items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Joseph Murphy</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Oct. 1, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>6 min read</span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="mb-12 rounded-xl overflow-hidden">
          <img
            src={googleAdGrantsImage}
            alt="Google Ad Grants for nonprofits"
            className="w-full h-[400px] object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <h2 className="text-3xl font-bold mt-8 mb-6">Introduction</h2>
          <p className="mb-4">
            Google's Ad Grants program gives nonprofits up to $10,000 per month in free search ads, but most organizations barely use half of it — or lose eligibility altogether due to inactivity or poor ad performance. In 2025, Google is tightening compliance and boosting AI-driven ad features, meaning smart nonprofits can do more with less manual effort — if they know how.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6">1. Revisit Eligibility & Compliance</h2>
          <p className="mb-4">
            Google's 2025 updates now emphasize account activity, conversion tracking, and quality scores.
          </p>
          <p className="mb-2"><strong>To stay compliant:</strong></p>
          <ul className="space-y-2 mb-4">
            <li>Maintain a 5% CTR (Click-Through Rate) average across all campaigns.</li>
            <li>Use conversion tracking for donations, sign-ups, or event registrations.</li>
            <li>Log into the account monthly and actively optimize campaigns.</li>
            <li>Have a live SSL-secured website with substantial nonprofit content and a clear mission.</li>
          </ul>
          <div className="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded-r-lg">
            <p className="font-semibold mb-2">✅ Action Tip:</p>
            <p>
              If you've ignored your Ad Grant for months, request a re-activation audit. Tools like Google Tag Manager or Causeio's own analytics dashboard can verify that your conversions are properly firing.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-6">2. Focus on Search Intent, Not Vanity Clicks</h2>
          <p className="mb-4">
            In 2025, AI-assisted ads mean better targeting — but also more competition from paid advertisers. You don't want just traffic; you want meaningful engagement.
          </p>
          <p className="mb-2"><strong>Prioritize intent-driven keywords:</strong></p>
          <ul className="space-y-2 mb-4">
            <li>"donate to [cause] near me"</li>
            <li>"volunteer opportunities for [demographic]"</li>
            <li>"nonprofits helping [community issue]"</li>
          </ul>
          <p className="mb-4">
            Avoid broad, costly terms like "charity" or "help people." Google's AI now measures engagement time post-click; low relevance can jeopardize your grant.
          </p>
          <div className="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded-r-lg">
            <p className="font-semibold mb-2">✅ Action Tip:</p>
            <p>
              Use your free Ad Grant for awareness campaigns, and run paid search or social ads (Facebook, Instagram, LinkedIn) for conversions — a hybrid approach proven to boost ROI by 30%+.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-6">3. Pair Ad Grants with Paid Ads Strategically</h2>
          <p className="mb-4">
            Paid ads unlock visual formats (Video, Display, Shopping) and location targeting unavailable under Ad Grants. Smart nonprofits use both:
          </p>
          <ul className="space-y-2 mb-4">
            <li><strong>Ad Grant:</strong> Brand and mission awareness, blog traffic, free webinar registrations.</li>
            <li><strong>Paid Ads:</strong> Retargeting site visitors, donation appeals, and high-value conversions.</li>
          </ul>
          <div className="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded-r-lg">
            <p className="font-semibold mb-2">✅ Action Tip:</p>
            <p>
              Build a shared analytics dashboard combining both Ad Grant and Paid data. Compare CTR, CPC, and conversion rates monthly — and allocate real ad dollars where you get the highest mission impact.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-6">4. Automate Optimization with AI</h2>
          <p className="mb-4">
            Google's Performance Max and AI Recommendations help nonprofits with limited staff:
          </p>
          <ul className="space-y-2 mb-4">
            <li>Auto-optimize for conversions based on past donor behavior.</li>
            <li>Suggest new ad copy and negative keywords to preserve budget.</li>
            <li>Surface trending local search terms.</li>
          </ul>
          <div className="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded-r-lg">
            <p className="font-semibold mb-2">✅ Action Tip:</p>
            <p>
              Enable "Auto Apply Recommendations" on a test campaign to see how AI refines targeting. Monitor weekly for performance changes.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-6">Closing</h2>
          <p className="mb-4">
            If your nonprofit isn't fully using Google's Ad Grant, you're leaving money — and mission impact — on the table. By combining smart compliance, intent-based targeting, and selective paid ads, you can reach thousands more supporters each month without increasing your budget.
          </p>
          <p className="mb-8">
            Causeio can even help you audit or rebuild your Ad Grant campaigns — just ask us in your next check-in.
          </p>
        </div>

        {/* CTA Section */}
        <div className="mt-16 p-8 bg-primary/5 rounded-xl border border-primary/10">
          <h3 className="text-2xl font-bold mb-4">Need Help with Google Ad Grants?</h3>
          <p className="text-muted-foreground mb-6">
            Let Causeio help you maximize your free advertising dollars. From compliance audits to AI-powered campaign optimization, we'll help you turn clicks into real impact.
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

export default BlogPostGoogleGrants;
