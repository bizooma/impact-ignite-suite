import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MessageSquare, QrCode, Share2, BarChart3, Zap, Shield, Users, Check, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import heroBackground from "@/assets/hero-background.jpg";
import causeioLogo from "@/assets/causeio-logo.png";

const Landing = () => {
  const { user, loading } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Navigation */}
      <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src={causeioLogo} alt="Causeio - Where Purpose Meets Performance" className="h-12" />
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            {loading ? (
              <Button variant="outline" disabled>
                Loading...
              </Button>
            ) : user ? (
              <Link to="/dashboard">
                <Button variant="default">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full py-20 px-6 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
          style={{ 
            backgroundImage: `url(${heroBackground})`,
            transform: `translateY(${scrollY * 0.5}px) scale(1.1)`
          }}
        ></div>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="w-full max-w-5xl mx-auto text-center relative z-10">
          <Badge variant="secondary" className="mb-4">
            🚀 New: AI-Powered Marketing Tools
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            Ignite Your Impact with Smart Business Tools
          </h1>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Transform your business with AI chatbots, dynamic QR codes, social media automation, and SEO optimization. 
            Everything you need to grow your digital presence in one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full py-20 px-6 bg-muted/30">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Scale</h2>
            <p className="text-xl text-muted-foreground">
              Powerful tools designed for modern businesses
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-2 hover:border-primary/20 transition-all duration-200">
              <CardHeader>
                <MessageSquare className="w-12 h-12 text-primary mb-4" />
                <CardTitle>AI Chatbots</CardTitle>
                <CardDescription>
                  Intelligent customer support that learns from your business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />24/7 Support</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Custom Training</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Lead Generation</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200">
              <CardHeader>
                <QrCode className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Smart QR Codes</CardTitle>
                <CardDescription>
                  Dynamic QR codes with tracking and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Real-time Analytics</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Custom Branding</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Dynamic Links</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200">
              <CardHeader>
                <Share2 className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Social Automation</CardTitle>
                <CardDescription>
                  Schedule and manage all your social media from one place
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Multi-Platform</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Smart Scheduling</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Content Templates</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200">
              <CardHeader>
                <BarChart3 className="w-12 h-12 text-primary mb-4" />
                <CardTitle>SEO Analytics</CardTitle>
                <CardDescription>
                  Comprehensive SEO audits and optimization recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Site Audits</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Keyword Tracking</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Competitor Analysis</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="w-full py-20 px-6">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by Growing Businesses</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of companies using Causeio to scale their impact
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Causeio transformed our customer service. Our chatbot handles 80% of inquiries automatically."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold mr-3">
                    JS
                  </div>
                  <div>
                    <div className="font-semibold">Jane Smith</div>
                    <div className="text-sm text-muted-foreground">CEO, TechCorp</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "The QR code analytics helped us increase our offline-to-online conversion by 300%."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold mr-3">
                    MD
                  </div>
                  <div>
                    <div className="font-semibold">Mike Davis</div>
                    <div className="text-sm text-muted-foreground">Marketing Dir, RetailPlus</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Managing all our social media from one dashboard saved us 20 hours per week."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold mr-3">
                    AL
                  </div>
                  <div>
                    <div className="font-semibold">Anna Lee</div>
                    <div className="text-sm text-muted-foreground">Founder, Creative Agency</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="w-full py-20 px-6 bg-muted/30">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Choose Causeio?</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Shield className="w-8 h-8 text-primary mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
                    <p className="text-muted-foreground">
                      Bank-level security with SOC 2 compliance and end-to-end encryption.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Users className="w-8 h-8 text-primary mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
                    <p className="text-muted-foreground">
                      Dedicated customer success team to help you maximize your ROI.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Zap className="w-8 h-8 text-primary mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                    <p className="text-muted-foreground">
                      Built for speed with 99.9% uptime guarantee and global CDN.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">10x</div>
                <p className="text-xl font-semibold mb-4">Faster Growth</p>
                <p className="text-muted-foreground">
                  Companies using Causeio see 10x faster growth in their digital engagement metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 px-6">
        <div className="w-full max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Ignite Your Impact?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of businesses already using Causeio to transform their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="text-lg px-8">
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t bg-muted/50 py-12 px-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src={causeioLogo} alt="Causeio - Where Purpose Meets Performance" className="h-10" />
              </div>
              <p className="text-muted-foreground">
                Empowering businesses with intelligent automation and growth tools.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/pricing" className="hover:text-primary">Pricing</Link></li>
                <li><a href="#" className="hover:text-primary">Features</a></li>
                <li><a href="#" className="hover:text-primary">API Docs</a></li>
                <li><a href="#" className="hover:text-primary">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">About</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
                <li><a href="#" className="hover:text-primary">Careers</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Help Center</a></li>
                <li><a href="#" className="hover:text-primary">Community</a></li>
                <li><a href="#" className="hover:text-primary">Status</a></li>
                <li><a href="#" className="hover:text-primary">Security</a></li>
              </ul>
            </div>
          </div>
          
          {/* Google Maps */}
          <div className="mt-8">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3443.794538479383!2d-81.6591862!3d30.3283615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88e5b7ba8c79c7b7%3A0x29d0d337ce7701c4!2sBizooma%20Digital%20Marketing%20Agency!5e0!3m2!1sen!2sus!4v1758978178589!5m2!1sen!2sus" 
              width="100%" 
              height="450" 
              className="border-0 rounded-lg" 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 Causeio, A <a href="https://bizooma.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">Bizooma, LLC</a> Company | All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;