import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Facebook,
  Linkedin,
  Mail,
  CreditCard,
  Building,
  Smartphone,
  Accessibility,
  ArrowRight,
  Plug,
} from 'lucide-react';

interface IntegrationsDashboardProps {
  organizationId: string;
}

interface IntegrationLink {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  category: 'Social' | 'Email & CRM' | 'Payments' | 'Google Business' | 'Mobile App' | 'Accessibility';
  cta?: string;
}

const links: IntegrationLink[] = [
  {
    title: 'Facebook Pages',
    description: 'Connect Facebook Pages to publish and schedule posts.',
    icon: Facebook,
    to: '/dashboard/social?tab=integrations',
    category: 'Social',
  },
  {
    title: 'LinkedIn Pages',
    description: 'Connect LinkedIn organization pages for publishing.',
    icon: Linkedin,
    to: '/dashboard/social?tab=integrations',
    category: 'Social',
  },
  {
    title: 'Mailchimp',
    description: 'Two-way sync between CRM lists and Mailchimp audiences.',
    icon: Mail,
    to: '/dashboard/crm?tab=mailchimp',
    category: 'Email & CRM',
  },
  {
    title: 'Stripe (donations)',
    description: 'Accept one-time and recurring online donations into the CRM.',
    icon: CreditCard,
    to: '/dashboard/crm?tab=stripe',
    category: 'Payments',
  },
  {
    title: 'Google Business Profile',
    description: 'Sync reviews and post AI-drafted replies to Google.',
    icon: Building,
    to: '/dashboard/gbp',
    category: 'Google Business',
  },
  {
    title: 'Mobile App API',
    description: 'API keys and configuration for the connected mobile app.',
    icon: Smartphone,
    to: '/dashboard/mobile-content',
    category: 'Mobile App',
  },
  {
    title: 'Accessibility Widget',
    description: 'Install snippet, statement, and per-site widget settings.',
    icon: Accessibility,
    to: '/dashboard/accessibility',
    category: 'Accessibility',
  },
];

const categories: IntegrationLink['category'][] = [
  'Social',
  'Email & CRM',
  'Payments',
  'Google Business',
  'Mobile App',
  'Accessibility',
];

const IntegrationsDashboard: React.FC<IntegrationsDashboardProps> = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Plug className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your organization to the tools you already use. Each integration is configured inside its own app.
          </p>
        </div>
      </div>

      {categories.map((category) => {
        const items = links.filter((l) => l.category === category);
        if (items.length === 0) return null;
        return (
          <section key={category} className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{category}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">{item.description}</CardDescription>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link to={item.to}>
                          {item.cta ?? 'Configure'}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default IntegrationsDashboard;
