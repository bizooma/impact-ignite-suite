import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, QrCode, Calendar, BarChart3, Building, Users, CheckSquare, TrendingUp, Settings, Shield, Smartphone, User, LogOut, Lock, UserCircle, DollarSign, Megaphone, Layers, Sparkles, HelpCircle } from 'lucide-react';
import causeioLogo from '@/assets/causeio-logo-full.png';
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
import { useProductAccess, ProductId } from '@/hooks/useProductAccess';
import { useOrganization } from '@/hooks/useOrganization';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OrgSwitcher } from './OrgSwitcher';

const navigationItems: Array<{
  title: string;
  url: string;
  icon: any;
  productId?: ProductId;
  alwaysShow?: boolean;
}> = [
  { title: 'Dashboard', url: '/dashboard', icon: Home, alwaysShow: true },
  { title: 'Chatbots', url: '/dashboard/chatbots', icon: MessageCircle, productId: 'chatbots' },
  { title: 'QR Codes', url: '/dashboard/qr-codes', icon: QrCode, productId: 'qr_codes' },
  { title: 'CRM', url: '/dashboard/crm', icon: UserCircle, productId: 'crm' },
  { title: 'Campaigns', url: '/dashboard/campaigns', icon: Megaphone, alwaysShow: true },
  { title: 'Social Media', url: '/dashboard/social', icon: Calendar, productId: 'social_media' },
  { title: 'SEO Audits', url: '/dashboard/seo', icon: BarChart3, productId: 'seo_audits' },
  { title: 'Google Business', url: '/dashboard/gbp', icon: Building, productId: 'google_business' },
  { title: 'Tasks', url: '/dashboard/tasks', icon: CheckSquare, productId: 'tasks' },
  { title: 'Analytics', url: '/dashboard/analytics', icon: TrendingUp, productId: 'analytics' },
  { title: 'Mobile App', url: '/dashboard/mobile-app', icon: Smartphone, productId: 'mobile_app' },
  { title: 'Mobile Content', url: '/dashboard/mobile-content', icon: Layers, productId: 'mobile_app' },
];

const adminItems = [
  { title: 'Integrations', url: '/dashboard/integrations', icon: Settings },
  { title: 'Team Members', url: '/dashboard/members', icon: Users },
];

const resourceItems = [
  { title: 'Google Ad Grants', url: '/dashboard/resources/google-ad-grants', icon: DollarSign },
  { title: 'Support', url: '/dashboard/support', icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { isPlatformAdmin } = usePlatformAdmin();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { hasAccess } = useProductAccess();
  const { organization } = useOrganization();
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);

  useEffect(() => {
    if (!user || !organization) {
      setIsOrgAdmin(false);
      return;
    }
    supabase
      .from('memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organization.id)
      .maybeSingle()
      .then(({ data }) => {
        setIsOrgAdmin(data?.role === 'admin' || data?.role === 'owner');
      });
  }, [user, organization]);

  const initials = (profile?.display_name || user?.email || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? 'bg-sidebar-accent text-blue-900 font-medium' 
      : 'hover:bg-sidebar-accent/50 text-blue-900';

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <NavLink to="/" className="flex items-center hover:opacity-80 transition-opacity">
            {collapsed ? (
              <img src={causeioLogo} alt="Causeio" className="h-8 w-8 object-contain" />
            ) : (
              <img src={causeioLogo} alt="Causeio - Where Purpose Meets Performance" className="h-10 w-auto object-contain" />
            )}
          </NavLink>
        </div>

        <OrgSwitcher collapsed={collapsed} />

        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                // Mobile Content is only shown for orgs that have a mobile app provisioned.
                if (item.url === '/dashboard/mobile-content' && !(organization as any)?.mobile_api_enabled) {
                  return null;
                }
                const hasProductAccess = item.alwaysShow || !item.productId || hasAccess(item.productId);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.url === '/dashboard'}
                        className={getNavCls}
                      >
                        <item.icon className="w-4 h-4" />
                        {!collapsed && (
                          <span className={!hasProductAccess ? 'opacity-60' : ''}>
                            {item.title}
                          </span>
                        )}
                        {!collapsed && !hasProductAccess && (
                          <Lock className="w-3 h-3 ml-auto text-red-600" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
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

        {(organization as any)?.is_beta_org && (
          <SidebarGroup>
            <SidebarGroupLabel>Beta Program</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/pricing-beta" className={getNavCls}>
                      <Sparkles className="w-4 h-4 text-red-600" />
                      {!collapsed && <span className="font-medium">Beta Pricing</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isOrgAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="w-4 h-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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