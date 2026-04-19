import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { PlatformAdminProvider } from "@/hooks/usePlatformAdmin";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ProtectedProductRoute } from "@/components/upgrade/ProtectedProductRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import Landing from "./pages/Landing";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogPostGoogleGrants from "./pages/BlogPostGoogleGrants";
import BlogPostVolunteerRecruitment from "./pages/BlogPostVolunteerRecruitment";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { MainDashboard } from "./components/dashboard/MainDashboard";
import ChatbotDashboard from "./components/chatbot/ChatbotDashboard";
import QrCodeDashboard from "./components/qr/QrCodeDashboard";
import SocialMediaDashboard from "./components/social/SocialMediaDashboard";
import SeoAuditDashboard from "./components/seo/SeoAuditDashboard";
import GbpDashboard from "./components/gbp/GbpDashboard";
import { CrmDashboard } from "./components/crm/CrmDashboard";
import TaskDashboard from "./components/tasks/TaskDashboard";
import AnalyticsDashboard from "./components/analytics/AnalyticsDashboard";
import IntegrationsDashboard from "./components/integrations/IntegrationsDashboard";
import { MobileAppDashboard } from "./components/mobile/MobileAppDashboard";
import { MobileContentDashboard } from "./components/mobile-content/MobileContentDashboard";
import Profile from "./pages/Profile";
import { MembershipManagement } from "./components/admin/MembershipManagement";
import GoogleAdGrants from "./pages/GoogleAdGrants";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import PricingBeta from "./pages/PricingBeta";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PlatformAdminProvider>
        <OrganizationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <SidebarProvider>
                <Routes>
                {/* Marketing and public pages */}
                <Route path="/" element={<Landing />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/ai-video-multichannel-nonprofits-2025" element={<BlogPost />} />
                <Route path="/blog/google-ad-grants-nonprofits-2025" element={<BlogPostGoogleGrants />} />
                <Route path="/blog/volunteer-recruitment-chatbots-2025" element={<BlogPostVolunteerRecruitment />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancel" element={<PaymentCancel />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Admin route with sidebar */}
                <Route path="/admin" element={
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <header className="h-12 flex items-center border-b bg-card px-4">
                        <SidebarTrigger />
                      </header>
                      <AdminDashboard />
                    </main>
                  </div>
                } />
                
                {/* Dashboard routes (protected) */}
                <Route path="/dashboard/*" element={
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <header className="h-12 flex items-center border-b bg-card px-4">
                        <SidebarTrigger />
                      </header>
                      <div className="p-6">
                        <DashboardLayout>
                          {(organizationId) => (
                            <Routes>
                              <Route path="/" element={<MainDashboard organizationId={organizationId} />} />
                              <Route path="/chatbots" element={
                                <ProtectedProductRoute
                                  productId="chatbots"
                                  productName="Chatbot Builder"
                                  description="Create AI-powered chatbots to engage your audience 24/7"
                                  features={[
                                    "Build custom AI chatbots with your organization's knowledge",
                                    "Upload documents, websites, and text as knowledge sources",
                                    "Embed chatbot widget on your website",
                                    "Track conversations and capture leads",
                                    "View detailed analytics and chat history"
                                  ]}
                                >
                                  <ChatbotDashboard organizationId={organizationId} />
                                </ProtectedProductRoute>
                              } />
                              <Route path="/qr-codes" element={
                                <ProtectedProductRoute
                                  productId="qr_codes"
                                  productName="QR Code Generator"
                                  description="Create trackable QR codes for marketing campaigns and events"
                                  features={[
                                    "Generate dynamic QR codes with custom designs",
                                    "Track scans with detailed analytics",
                                    "Add UTM parameters for campaign tracking",
                                    "Customize colors and branding",
                                    "Export QR codes in multiple formats"
                                  ]}
                                >
                                  <QrCodeDashboard organizationId={organizationId} />
                                </ProtectedProductRoute>
                              } />
                              <Route path="/social" element={
                                <ProtectedProductRoute
                                  productId="social_media"
                                  productName="Social Media Manager"
                                  description="Manage and schedule posts across all your social platforms"
                                  features={[
                                    "Schedule posts across multiple platforms",
                                    "Create and manage social media campaigns",
                                    "Track post performance and engagement",
                                    "Collaborate with your team on content",
                                    "Generate content ideas with AI assistance"
                                  ]}
                                >
                                  <SocialMediaDashboard organizationId={organizationId} />
                                </ProtectedProductRoute>
                              } />
                              <Route path="/seo" element={
                                <ProtectedProductRoute
                                  productId="seo_audits"
                                  productName="SEO Audit Tools"
                                  description="Comprehensive SEO analysis to improve your search rankings"
                                  features={[
                                    "Complete technical SEO audits",
                                    "Content optimization recommendations",
                                    "Schema markup analysis",
                                    "Voice search optimization (AEO)",
                                    "Track and fix SEO issues over time"
                                  ]}
                                >
                                  <SeoAuditDashboard organizationId={organizationId} />
                                </ProtectedProductRoute>
                              } />
                              <Route path="/gbp" element={
                                <ProtectedProductRoute
                                  productId="google_business"
                                  productName="Google Business Profile Manager"
                                  description="Optimize and manage your Google Business Profile"
                                  features={[
                                    "Sync and update your Google Business Profile",
                                    "Track profile completeness and optimization",
                                    "Manage business categories and attributes",
                                    "Monitor profile performance",
                                    "Receive optimization recommendations"
                                  ]}
                                >
                                  <GbpDashboard organizationId={organizationId} />
                                </ProtectedProductRoute>
                              } />
                              <Route path="/crm" element={
                                <ProtectedProductRoute
                                  productId="crm"
                                  productName="CRM"
                                  description="Manage all your constituent relationships in one place"
                                  features={[
                                    "Track volunteers, donors, and members",
                                    "Organize contacts into segmented lists",
                                    "Log interactions and activities",
                                    "Manage donations and volunteer hours",
                                    "Automatic integration with chatbots and other products"
                                  ]}
                                >
                                  <CrmDashboard organizationId={organizationId} />
                                </ProtectedProductRoute>
                              } />
                              <Route path="/tasks" element={
                                <ProtectedProductRoute
                                  productId="tasks"
                                  productName="Task Management"
                                  description="Track and manage tasks across all modules"
                                  features={[
                                    "Centralized task tracking and management",
                                    "Assign tasks to team members",
                                    "Set priorities and due dates",
                                    "Tasks auto-generated from other modules",
                                    "Track task completion and performance"
                                  ]}
                                >
                                  <TaskDashboard organizationId={organizationId} />
                                </ProtectedProductRoute>
                              } />
                              <Route path="/analytics" element={
                                <ProtectedProductRoute
                                  productId="analytics"
                                  productName="Analytics Dashboard"
                                  description="Comprehensive analytics across all your tools"
                                  features={[
                                    "Unified analytics from all modules",
                                    "Custom reports and data visualization",
                                    "Track KPIs and performance metrics",
                                    "Export data for deeper analysis",
                                    "Scheduled reports delivered to your inbox"
                                  ]}
                                >
                                  <AnalyticsDashboard organizationId={organizationId} />
                                </ProtectedProductRoute>
                              } />
                              <Route path="/integrations" element={<IntegrationsDashboard organizationId={organizationId} />} />
                              <Route path="/mobile-app" element={
                                <ProtectedProductRoute
                                  productId="mobile_app"
                                  productName="Mobile App Management"
                                  description="Manage your organization's mobile application"
                                  features={[
                                    "Manage mobile app users and permissions",
                                    "View and moderate chat conversations",
                                    "Configure app settings and features",
                                    "Track app usage and analytics",
                                    "Export data and generate reports"
                                  ]}
                                >
                                  <MobileAppDashboard organizationId={organizationId} />
                                </ProtectedProductRoute>
                              } />
                              <Route path="/mobile-content" element={<MobileContentDashboard organizationId={organizationId} />} />
                              <Route path="/campaigns" element={<Campaigns organizationId={organizationId} />} />
                              <Route path="/campaigns/:id" element={<CampaignDetail organizationId={organizationId} />} />
                              <Route path="/members" element={<MembershipManagement organizationId={organizationId} />} />
                              <Route path="/profile" element={<Profile />} />
                              <Route path="/pricing-beta" element={<PricingBeta />} />
                              <Route path="/resources/google-ad-grants" element={<GoogleAdGrants />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          )}
                        </DashboardLayout>
                      </div>
                    </main>
                  </div>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
              </SidebarProvider>
            </BrowserRouter>
          </TooltipProvider>
        </OrganizationProvider>
      </PlatformAdminProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
