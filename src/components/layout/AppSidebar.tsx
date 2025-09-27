import { NavLink, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, QrCode, Calendar, BarChart3, Building, Users, FileText, CheckSquare, TrendingUp, Settings, Shield } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

const navigationItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Heart },
  { title: 'Chatbots', url: '/dashboard/chatbots', icon: MessageCircle },
  { title: 'QR Codes', url: '/dashboard/qr-codes', icon: QrCode },
  { title: 'Social Media', url: '/dashboard/social', icon: Calendar },
  { title: 'SEO Audits', url: '/dashboard/seo', icon: BarChart3 },
  { title: 'Google Business', url: '/dashboard/gbp', icon: Building },
  { title: 'Content Templates', url: '/dashboard/content', icon: FileText },
  { title: 'Tasks', url: '/dashboard/tasks', icon: CheckSquare },
  { title: 'Analytics', url: '/dashboard/analytics', icon: TrendingUp },
  { title: 'Integrations', url: '/dashboard/integrations', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';
  const { isPlatformAdmin } = usePlatformAdmin();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'hover:bg-sidebar-accent/50';

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && <h1 className="text-xl font-semibold text-sidebar-foreground">Causeio</h1>}
          </NavLink>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/dashboard'}
                      className={getNavCls}
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isPlatformAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/admin" 
                      className={getNavCls}
                    >
                      <Shield className="w-4 h-4" />
                      {!collapsed && <span>Platform Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}