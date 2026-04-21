import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, User } from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import googleAdGrantsImage from "@/assets/blog/google-ad-grants-nonprofits.jpg";
import volunteerChatbotsImage from "@/assets/blog/volunteer-recruitment-chatbots.jpg";
import aiVideoMultichannelImage from "@/assets/blog/ai-video-multichannel-nonprofits.jpg";
import qrCodesImage from "@/assets/blog/qr-codes-nonprofits.jpg";

const blogPosts = [
  {
    id: 1,
    title: "Harnessing AI, Video & the Multi-Channel Push: Big Digital Wins for Nonprofits in 2025",
    excerpt: "2025 is shaping up to be a pivotal year for nonprofits that get serious about digital marketing.",
    image: aiVideoMultichannelImage,
    author: "Joseph Murphy",
    date: "Sept. 15, 2025",
    readTime: "8 min read",
    category: "AI & Automation",
    slug: "/blog/ai-video-multichannel-nonprofits-2025"
  },
  {
    id: 2,
    title: "Making Google Ad Grants Work for You: How Nonprofits Can Turn Free Ad Dollars into Real Impact in 2025",
    excerpt: "Google's Ad Grants program gives nonprofits up to $10,000 per month in free search ads.",
    image: googleAdGrantsImage,
    author: "Joseph Murphy",
    date: "Oct. 1, 2025",
    readTime: "6 min read",
    category: "Marketing",
    slug: "/blog/google-ad-grants-nonprofits-2025"
  },
  {
    id: 3,
    title: "Recruit Volunteers Smarter: How Chatbots & Messaging Are Transforming Nonprofit Engagement in 2025",
    excerpt: "Recruiting volunteers has always been a manual process — emails, forms, follow-ups — until now.",
    image: volunteerChatbotsImage,
    author: "Joseph Murphy",
    date: "Oct. 15, 2025",
    readTime: "7 min read",
    category: "Volunteer Engagement",
    slug: "/blog/volunteer-recruitment-chatbots-2025"
  },
  {
    id: 4,
    title: "QR Codes for Nonprofits: Best Practices to Boost Donations, Events & Engagement in 2025",
    excerpt: "QR codes turn every flyer, sign, and t-shirt into a measurable fundraising channel — if you use them right.",
    image: qrCodesImage,
    author: "Joseph Murphy",
    date: "Nov. 1, 2025",
    readTime: "7 min read",
    category: "Marketing",
    slug: "/blog/qr-codes-nonprofits-2025"
  }
];

export default function Blog() {
  return (
    <>
      <SEOHead
        title="Nonprofit Digital Marketing Blog | Causeio Resources"
        description="Expert insights, success stories, and proven strategies for nonprofit digital marketing, AI automation, volunteer recruitment, and donor engagement."
        keywords="nonprofit blog, digital marketing for nonprofits, volunteer recruitment, Google Ad Grants, AI chatbots, nonprofit technology"
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <Link to="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
              Causeio
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-6 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-4">
              Blog & Resources
            </Badge>
            <h1 className="text-5xl font-bold mb-6">
              Insights for Nonprofit Leaders
            </h1>
            <p className="text-xl text-muted-foreground">
              Stay informed with expert tips, success stories, and the latest trends in nonprofit digital marketing
            </p>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16 px-6">
          <div className="container mx-auto max-w-7xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Card 
                  key={post.id} 
                  className="group overflow-hidden border-2 hover:border-primary/20 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="relative overflow-hidden aspect-video">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary">
                        {post.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <h2 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </div>

                    <Link to={post.slug}>
                      <Button 
                        variant="ghost" 
                        className="w-full group-hover:bg-primary/10 transition-colors"
                      >
                        Read Article
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Nonprofit's Digital Presence?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of nonprofits using Causeio to automate marketing and engage supporters
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pricing">
                <Button size="lg">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
