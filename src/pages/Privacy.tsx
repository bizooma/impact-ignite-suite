import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  const lastUpdated = "April 21, 2026";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Privacy Policy"
        description="Causeio's privacy policy explains how we collect, use, and protect your personal information when you use our nonprofit marketing platform."
        canonical="/privacy"
      />

      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">
            Causeio
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <article className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-foreground">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Causeio ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our
              nonprofit marketing and engagement platform (the "Service").
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-foreground">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Account information (name, email, organization name, password)</li>
              <li>Organization and contact data you upload to the platform</li>
              <li>Payment and billing information</li>
              <li>Communications you send to us</li>
              <li>Usage data, log data, and device information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-foreground">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We use your information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, prevent, and address technical issues and fraud</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-foreground">4. How We Share Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share information with service providers
              who perform services on our behalf (such as hosting, analytics, payment processing), when
              required by law, or with your consent. Data you upload remains owned by your organization.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-foreground">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures including encryption in transit, row-level
              security, and access controls to protect your information. However, no method of transmission
              or storage is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-foreground">6. Your Rights and Choices</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Access, update, or delete your account information</li>
              <li>Opt out of marketing communications</li>
              <li>Request a copy of your data</li>
              <li>Request deletion of your data, subject to legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-foreground">7. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our Service and hold
              certain information. You can instruct your browser to refuse all cookies or to indicate when
              a cookie is being sent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-foreground">8. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service is not directed to children under 13. We do not knowingly collect personal
              information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-foreground">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by
              posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-foreground">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@causeio.com" className="text-primary hover:underline">
                privacy@causeio.com
              </a>
              .
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default Privacy;
