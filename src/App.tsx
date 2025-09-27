import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AppSidebar } from "@/components/layout/AppSidebar";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OrganizationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <Routes>
                {/* Marketing and public pages */}
                <Route path="/" element={<Landing />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancel" element={<PaymentCancel />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Dashboard routes (protected) */}
                <Route path="/dashboard/*" element={
                  <>
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
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          )}
                        </DashboardLayout>
                      </div>
                    </main>
                  </>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            </SidebarProvider>
          </BrowserRouter>
        </TooltipProvider>
      </OrganizationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
