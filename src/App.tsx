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
import Landing from "./pages/Landing";
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
import ContentTemplatesDashboard from "./components/content/ContentTemplatesDashboard";
import TaskDashboard from "./components/tasks/TaskDashboard";
import AnalyticsDashboard from "./components/analytics/AnalyticsDashboard";
import IntegrationsDashboard from "./components/integrations/IntegrationsDashboard";
import { MobileAppDashboard } from "./components/mobile/MobileAppDashboard";

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
              <SidebarProvider>
                <Routes>
                {/* Marketing and public pages */}
                <Route path="/" element={<Landing />} />
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
                              <Route path="/chatbots" element={<ChatbotDashboard organizationId={organizationId} />} />
                              <Route path="/qr-codes" element={<QrCodeDashboard organizationId={organizationId} />} />
                              <Route path="/social" element={<SocialMediaDashboard organizationId={organizationId} />} />
                              <Route path="/seo" element={<SeoAuditDashboard organizationId={organizationId} />} />
                              <Route path="/gbp" element={<GbpDashboard organizationId={organizationId} />} />
                              <Route path="/content" element={<ContentTemplatesDashboard organizationId={organizationId} />} />
                              <Route path="/tasks" element={<TaskDashboard organizationId={organizationId} />} />
                              <Route path="/analytics" element={<AnalyticsDashboard organizationId={organizationId} />} />
                              <Route path="/integrations" element={<IntegrationsDashboard organizationId={organizationId} />} />
                              <Route path="/mobile-app" element={<MobileAppDashboard organizationId={organizationId} />} />
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
