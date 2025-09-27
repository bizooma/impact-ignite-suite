import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { AppSidebar } from "@/components/layout/AppSidebar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ChatbotBuilder } from "./components/chatbot/ChatbotBuilder";
import { QrCodeDashboard } from "./components/qr/QrCodeDashboard";
import { SocialMediaDashboard } from "./components/social/SocialMediaDashboard";
import { SeoAuditDashboard } from "./components/seo/SeoAuditDashboard";
import { GbpDashboard } from "./components/gbp/GbpDashboard";
import { ContentTemplatesDashboard } from "./components/content/ContentTemplatesDashboard";
import { TaskDashboard } from "./components/tasks/TaskDashboard";
import { AnalyticsDashboard } from "./components/analytics/AnalyticsDashboard";
import { IntegrationsDashboard } from "./components/integrations/IntegrationsDashboard";

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
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/*" element={
                    <>
                      <AppSidebar />
                      <main className="flex-1">
                        <header className="h-12 flex items-center border-b bg-card px-4">
                          <SidebarTrigger />
                        </header>
                        <div className="p-6">
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/chatbots" element={<ChatbotBuilder />} />
                            <Route path="/qr-codes" element={<QrCodeDashboard />} />
                            <Route path="/social" element={<SocialMediaDashboard />} />
                            <Route path="/seo" element={<SeoAuditDashboard />} />
                            <Route path="/gbp" element={<GbpDashboard />} />
                            <Route path="/content" element={<ContentTemplatesDashboard />} />
                            <Route path="/tasks" element={<TaskDashboard />} />
                            <Route path="/analytics" element={<AnalyticsDashboard />} />
                            <Route path="/integrations" element={<IntegrationsDashboard />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </div>
                      </main>
                    </>
                  } />
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
