import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, BookOpen, LifeBuoy } from 'lucide-react';
import { SupportChat } from '@/components/support/SupportChat';
import { SupportInbox } from '@/components/support/SupportInbox';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

export default function Support() {
  const { isPlatformAdmin } = usePlatformAdmin();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <LifeBuoy className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Support</h1>
          <p className="text-muted-foreground">We're here to help you succeed.</p>
        </div>
      </div>

      <SupportChat />

      {isPlatformAdmin && <SupportInbox />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <Mail className="w-6 h-6 text-primary mb-2" />
            <CardTitle>Email Support</CardTitle>
            <CardDescription>
              Reach our team directly. We typically respond within 1 business day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="mailto:support@causeio.com">support@causeio.com</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <BookOpen className="w-6 h-6 text-primary mb-2" />
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Browse guides, tutorials, and product docs to learn faster.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">View Docs</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <LifeBuoy className="w-6 h-6 text-primary mb-2" />
            <CardTitle>Submit a Request</CardTitle>
            <CardDescription>
              Report a bug or request a new feature. Our product team reviews every submission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Submit Request</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">How do I invite team members?</p>
            <p className="text-sm text-muted-foreground">
              Go to Team Members in the Admin section of the sidebar to send invitations.
            </p>
          </div>
          <div>
            <p className="font-medium">How do I upgrade my plan?</p>
            <p className="text-sm text-muted-foreground">
              Visit the Pricing page to view available plans and upgrade your subscription.
            </p>
          </div>
          <div>
            <p className="font-medium">Where can I find my integrations?</p>
            <p className="text-sm text-muted-foreground">
              Open the Integrations page from the Admin section to connect external services.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
