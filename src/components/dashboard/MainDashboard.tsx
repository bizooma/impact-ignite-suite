import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Settings,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface MainDashboardProps {
  organizationId: string;
}

const moduleCards = [
  {
    title: 'Chatbots',
    description: 'Create compassionate AI chatbots that connect with your community',
    icon: MessageCircle,
    route: 'chatbots',
    status: 'active',
    color: 'primary'
  },
  {
    title: 'QR Codes',
    description: 'Generate branded QR codes with UTM tracking for campaigns',
    icon: QrCode,
    route: 'qr-codes',
    status: 'active',
    color: 'success'
  },
  {
    title: 'Social Media',
    description: 'Plan, schedule, and publish mission-driven content',
    icon: Calendar,
    route: 'social',
    status: 'active',
    color: 'warning'
  },
  {
    title: 'SEO Audits',
    description: 'Optimize your website for search engines and AI assistants',
    icon: BarChart3,
    route: 'seo',
    status: 'active',
    color: 'primary'
  },
  {
    title: 'Google Business',
    description: 'Optimize your Google Business Profile for community visibility',
    icon: Building,
    route: 'gbp',
    status: 'active',
    color: 'success'
  },
  {
    title: 'Content Templates',
    description: 'Create and manage reusable content templates',
    icon: FileText,
    route: 'content',
    status: 'active',
    color: 'warning'
  },
  {
    title: 'Tasks',
    description: 'Manage your organization tasks and workflows',
    icon: CheckSquare,
    route: 'tasks',
    status: 'active',
    color: 'primary'
  },
  {
    title: 'Analytics',
    description: 'Track performance across all your digital initiatives',
    icon: TrendingUp,
    route: 'analytics',
    status: 'active',
    color: 'success'
  },
  {
    title: 'Integrations',
    description: 'Connect with external tools and services',
    icon: Settings,
    route: 'integrations',
    status: 'active',
    color: 'warning'
  }
];

export function MainDashboard({ organizationId }: MainDashboardProps) {
  const activeModules = moduleCards.filter(m => m.status === 'active');
  const comingSoonModules = moduleCards.filter(m => m.status === 'coming-soon');
  const { embeds, isLoading: embedsLoading } = useFlipbookEmbeds(organizationId);
  const [selectedFlipbook, setSelectedFlipbook] = useState<any>(null);

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
            <h2 className="text-2xl font-semibold text-foreground">Resources & Flipbooks</h2>
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
                    <Button className="w-full">
                      View Flipbook
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Modules */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold text-foreground">Ready to Use</h2>
          <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeModules.map((module) => (
            <Card key={module.route} className="border-2 border-border/50 hover:border-primary/50 transition-all duration-200 hover:shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-${module.color}/10 rounded-lg flex items-center justify-center`}>
                    <module.icon className={`w-6 h-6 text-${module.color}`} />
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
                <Button asChild className="w-full">
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

      {/* Call to Action */}
      <Card className="bg-accent border-2 border-accent-foreground/20">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold text-accent-foreground mb-4">
            Ready to amplify your impact?
          </h3>
          <p className="text-accent-foreground/80 mb-6 max-w-md mx-auto">
            Your complete nonprofit technology platform is now live! Start with any module to begin amplifying your mission and connecting with your community.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild>
              <Link to="chatbots">
                <MessageCircle className="w-4 h-4 mr-2" />
                Create Chatbot
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="social">
                <Calendar className="w-4 h-4 mr-2" />
                Social Media
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="qr-codes">
                <QrCode className="w-4 h-4 mr-2" />
                Generate QR Code
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="seo">
                <BarChart3 className="w-4 h-4 mr-2" />
                SEO Audit
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="gbp">
                <Building className="w-4 h-4 mr-2" />
                Google Business
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

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