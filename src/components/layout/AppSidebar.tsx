import { NavLink } from 'react-router-dom';
import { Heart, MessageCircle, QrCode, Calendar, BarChart3, Building, Users, FileText, CheckSquare, TrendingUp, Settings, Shield, Smartphone, User, LogOut } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import { Separator } from '@/components/ui/separator';

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
  const collapsed = state === 'collapsed';
  const { isPlatformAdmin } = usePlatformAdmin();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const initials = (profile?.display_name || user?.email || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/dashboard/mobile-app" 
                    className={getNavCls}
                  >
                    <Smartphone className="w-4 h-4" />
                    {!collapsed && <span>Mobile App</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
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

        <div className="mt-auto">
          <Separator className="mb-4" />
          <div className="px-3 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-9 w-9 border-2 border-sidebar-border">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.display_name || ''} />
                <AvatarFallback className="text-xs font-semibold bg-sidebar-primary/10 text-sidebar-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {profile?.display_name || 'User'}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {user?.email}
                  </p>
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="space-y-1">
                <NavLink to="/dashboard/profile">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </Button>
                </NavLink>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={signOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}