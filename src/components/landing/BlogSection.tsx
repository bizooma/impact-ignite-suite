import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, User } from "lucide-react";
import { Link } from "react-router-dom";

// Sample blog posts - in a real app, this would come from a CMS or API
const blogPosts = [
  {
    id: 1,
    title: "Harnessing AI, Video & the Multi-Channel Push: Big Digital Wins for Nonprofits in 2025",
    excerpt: "2025 is shaping up to be a pivotal year for nonprofits that get serious about digital marketing.",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80",
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
    image: "https://images.unsplash.com/photo-1606166325683-7e92d3f0e71f?w=800&auto=format&fit=crop&q=80",
    author: "Joseph Murphy",
    date: "Oct. 1, 2025",
    readTime: "4 min read",
    category: "Marketing",
    slug: "#"
  },
  {
    id: 3,
    title: "Voice Search Optimization for Nonprofits in 2025",
    excerpt: "Why voice SEO matters for nonprofits and how to optimize your content for Siri, Alexa, and Google Assistant to reach more supporters.",
    image: "https://images.unsplash.com/photo-1589254065878-42c9da997008?w=800&auto=format&fit=crop&q=80",
    author: "Emily Rodriguez",
    date: "March 5, 2025",
    readTime: "6 min read",
    category: "SEO",
    slug: "#"
  }
];

export function BlogSection() {
  return (
    <section className="w-full py-20 px-6 bg-muted/30">
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Latest Insights
          </Badge>
          <h2 className="text-4xl font-bold mb-4">Resources & Insights</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay informed with expert tips, nonprofit success stories, and the latest trends in digital marketing
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
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
                <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
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

        <div className="text-center">
          <Button size="lg" variant="outline">
            View All Articles
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
