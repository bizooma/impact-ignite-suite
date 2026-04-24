import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useFlipbookEmbeds } from '@/hooks/useFlipbooks';
import { FlipbookViewer } from '@/components/flipbook/FlipbookViewer';
import { 
  MessageCircle, 
  QrCode, 
  Calendar, 
  BarChart3, 
  Building, 
  FileText, 
  CheckSquare, 
  TrendingUp, 
  Users,
  ArrowRight,
  BookOpen,
  Accessibility
} from 'lucide-react';
import { FeedbackCard } from './FeedbackCard';

interface MainDashboardProps {
  organizationId: string;
}

// Cal Farley's Boys Ranch brand colors
const CAL_FARLEYS_NAVY = '#1e3a5f';
const CAL_FARLEYS_GOLD = '#f4c542';

const moduleCards = [
  {
    title: 'Chatbots',
    description: 'Create compassionate AI chatbots that connect with your community',
    icon: MessageCircle,
    route: 'chatbots',
    status: 'active',
    color: 'primary',
    ready: false
  },
  {
    title: 'QR Codes',
    description: 'Generate branded QR codes with UTM tracking for campaigns',
    icon: QrCode,
    route: 'qr-codes',
    status: 'active',
    color: 'success',
    ready: true
  },
  {
    title: 'Social Media',
    description: 'Plan, schedule, and publish mission-driven content',
    icon: Calendar,
    route: 'social',
    status: 'active',
    color: 'warning',
    ready: false
  },
  {
    title: 'SEO Audits',
    description: 'Optimize your website for search engines and AI assistants',
    icon: BarChart3,
    route: 'seo',
    status: 'active',
    color: 'primary',
    ready: true
  },
  {
    title: 'Google Business',
    description: 'Optimize your Google Business Profile for community visibility',
    icon: Building,
    route: 'gbp',
    status: 'active',
    color: 'success',
    ready: false
  },
  {
    title: 'Campaigns',
    description: 'Run Giving Tuesday & year-round fundraising appeals',
    icon: FileText,
    route: 'campaigns',
    status: 'active',
    color: 'warning',
    ready: false
  },
  {
    title: 'Tasks',
    description: 'Manage your organization tasks and workflows',
    icon: CheckSquare,
    route: 'tasks',
    status: 'active',
    color: 'success',
    ready: true
  },
  {
    title: 'Analytics',
    description: 'Track performance across all your digital initiatives',
    icon: TrendingUp,
    route: 'analytics',
    status: 'active',
    color: 'success',
    ready: true
  },
  {
    title: 'CRM',
    description: 'Manage contacts, donors, volunteers, and grant pipelines',
    icon: Users,
    route: 'crm',
    status: 'active',
    color: 'primary',
    ready: true
  },
  {
    title: 'Accessibility Widget',
    description: 'One-line install for WCAG-aligned accessibility enhancements',
    icon: Accessibility,
    route: 'accessibility',
    status: 'active',
    color: 'primary',
    ready: false
  }
];

export function MainDashboard({ organizationId }: MainDashboardProps) {
  const activeModules = moduleCards.filter(m => m.status === 'active');
  const comingSoonModules = moduleCards.filter(m => m.status === 'coming-soon');
  const { embeds, isLoading: embedsLoading } = useFlipbookEmbeds(organizationId);
  const [selectedFlipbook, setSelectedFlipbook] = useState<any>(null);

  // Fetch organization details for brand-specific styling
  const { data: organization } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', organizationId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Check if this is Cal Farley's organization
  const isCalFarleys = organization?.slug === 'cal-farleys-boys-ranch';
  
  // Logo blue button styling for all dashboard buttons
  const calFarleysButtonClass = 'bg-[hsl(217_91%_35%)] text-white hover:bg-[hsl(217_91%_28%)] border-[hsl(217_91%_35%)]';

  // Outline button styling — also use logo blue for consistency
  const calFarleysOutlineClass = 'bg-[hsl(217_91%_35%)] text-white hover:bg-[hsl(217_91%_28%)] border-[hsl(217_91%_35%)]';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Mission Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Empowering your nonprofit with compassionate technology. 
          Start with our active modules and build meaningful connections.
        </p>
      </div>

      {/* Flipbooks Section */}
      {embeds && embeds.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">Documents</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {embeds.map((embed) => {
              const flipbook = embed.flipbooks;
              if (!flipbook) return null;
              
              return (
                <Card
                  key={embed.id}
                  className="border-2 border-border/50 hover:border-primary/50 transition-all duration-200 hover:shadow-lg cursor-pointer"
                  onClick={() => setSelectedFlipbook(flipbook)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{flipbook.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {flipbook.description && (
                      <p className="text-muted-foreground">{flipbook.description}</p>
                    )}
                    <Button className={`w-full ${calFarleysButtonClass}`}>
                      View Proposal
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Modules */}
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">Ready to Use</h2>
            <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">In Development</h2>
            <div className="w-3 h-3 bg-destructive rounded-full" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeModules.map((module) => (
            <Card key={module.route} className="border-2 border-border/50 hover:border-primary/50 transition-all duration-200 hover:shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        module.ready ? 'bg-success animate-pulse' : 'bg-destructive'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{module.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {module.description}
                </p>
                <Button asChild className={`w-full ${calFarleysButtonClass}`}>
                  <Link to={module.route}>
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Coming Soon Modules */}
      {comingSoonModules.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">Coming Soon</h2>
            <div className="w-3 h-3 bg-warning rounded-full" />
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comingSoonModules.map((module) => (
              <Card key={module.route} className="border-2 border-border/20 opacity-75">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${module.color}/10 rounded-lg flex items-center justify-center`}>
                      <module.icon className={`w-5 h-5 text-${module.color}`} />
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    {module.description}
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Wishlist & Feedback */}
      <FeedbackCard organizationId={organizationId} />

      {/* Flipbook Viewer Dialog */}
      {selectedFlipbook && (
        <Dialog open={!!selectedFlipbook} onOpenChange={() => setSelectedFlipbook(null)}>
          <DialogContent className="max-w-[95vw] h-[95vh]">
            <FlipbookViewer
              pdfUrl={selectedFlipbook.pdf_url}
              title={selectedFlipbook.title}
              onClose={() => setSelectedFlipbook(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}