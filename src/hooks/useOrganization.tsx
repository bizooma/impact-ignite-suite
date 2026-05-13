import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  has_mobile_app?: boolean;
  mobile_app_code?: string;
  purchased_products?: string[];
  brand_color?: string;
  is_beta_org?: boolean;
  beta_signup_id?: string | null;
  subscription_tier?: string | null;
}

interface OrganizationContextType {
  organization: Organization | null;
  organizations: Organization[];
  loading: boolean;
  createOrganization: (name: string, slug: string, mobileAppCode?: string) => Promise<void>;
  switchOrganization: (orgId: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    } else {
      setOrganizations([]);
      setOrganization(null);
      setLoading(false);
    }
  }, [user]);

  const fetchOrganizations = async () => {
    try {
      const { data: memberships } = await supabase
        .from('memberships')
        .select(`
          organization_id,
          organizations (
            id,
            name,
            slug,
            description,
            logo_url,
            website,
            has_mobile_app,
            mobile_app_code,
            purchased_products,
            brand_color,
            is_beta_org,
            beta_signup_id,
            subscription_tier
          )
        `)
        .eq('user_id', user?.id);

      if (memberships) {
        const orgs = memberships
          .map(m => {
            if (!m.organizations) return null;
            return {
              ...m.organizations,
              purchased_products: Array.isArray(m.organizations.purchased_products) 
                ? m.organizations.purchased_products as string[]
                : []
            } as Organization;
          })
          .filter(Boolean) as Organization[];
        
        setOrganizations(orgs);
        
        // Set first org as current if none selected
        if (orgs.length > 0 && !organization) {
          setOrganization(orgs[0]);
        }

        // Auto-provision org from signup metadata if user has none
        if (orgs.length === 0 && user) {
          const pendingOrgName = (user as any)?.user_metadata?.organization_name as string | undefined;
          if (pendingOrgName && pendingOrgName.trim().length >= 2) {
            await autoProvisionOrg(pendingOrgName.trim());
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoProvisionOrg = async (name: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke('provision-org', {
        body: { organizationName: name },
      });
      if (error) throw error;
      // Refresh the user so user_metadata.organization_name is cleared locally too.
      await supabase.auth.refreshSession();
      // Re-fetch memberships to pick up the newly-created org.
      await fetchOrganizations();
      if (!data?.alreadyExisted) {
        toast.success(`Welcome! ${name} is ready to go.`);
      }
    } catch (error: any) {
      console.error('Auto-provision org failed:', error);
      toast.error(error?.message || 'Could not set up your organization automatically.');
    }
  };

  const createOrganization = async (name: string, slug: string, mobileAppCode?: string) => {
    if (!user) return;

    try {
      let org: Organization;
      let isNewOrg = true;

      // If mobile app code is provided, see if it matches an existing org.
      // Joining is gated through a secure RPC + owner approval — never an
      // immediate self-granted membership.
      if (mobileAppCode) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('request_org_join', {
          p_mobile_app_code: mobileAppCode,
        });

        if (rpcError) throw rpcError;

        const result = rpcData as {
          status: 'pending' | 'already_member' | 'already_pending' | 'not_found';
          request_id?: string;
          organization_id?: string;
          organization_name?: string;
        } | null;

        if (result?.status === 'already_member') {
          toast.info(`You're already a member of ${result.organization_name}`);
          await fetchOrganizations();
          return;
        }

        if (result?.status === 'pending' || result?.status === 'already_pending') {
          // Fire-and-forget owner notification email. Don't block UX on it.
          if (result.status === 'pending' && result.request_id) {
            supabase.functions
              .invoke('notify-org-join-request', { body: { request_id: result.request_id } })
              .catch((e) => console.warn('notify-org-join-request failed', e));
          }
          toast.success(
            `Request sent to ${result.organization_name}. You'll get access once the owner approves.`
          );
          await fetchOrganizations();
          return;
        }

        // status === 'not_found' → fall through and create a new org with this code.
      }

      // Create new organization
      const orgData: any = { name, slug };
      
      if (mobileAppCode) {
        orgData.mobile_app_code = mobileAppCode;
        orgData.has_mobile_app = true;
      }
      
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert([orgData])
        .select()
        .single();

      if (orgError) throw orgError;
      org = {
        ...newOrg,
        purchased_products: Array.isArray(newOrg.purchased_products)
          ? newOrg.purchased_products as string[]
          : []
      } as Organization;

      // If mobile app code provided, link to mobile_app_databases
      if (mobileAppCode && org) {
        const { error: linkError } = await supabase
          .from('mobile_app_databases')
          .update({ organization_id: org.id })
          .eq('organization_code', mobileAppCode)
          .eq('organization_id', null as any);
        
        if (linkError) {
          console.error('Failed to link mobile app:', linkError);
          toast.error('Organization created but failed to link mobile app. Contact support.');
        } else {
          toast.success('Organization created with mobile app access!');
        }
      }

      // Create membership - first user is owner
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert([{
          user_id: user.id,
          organization_id: org.id,
          role: 'owner' // First user is owner
        }]);

      if (membershipError) throw membershipError;

      if (!mobileAppCode) {
        toast.success('Organization created successfully');
      }
      await fetchOrganizations();
      setOrganization(org);
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast.error(error.message || 'Failed to create organization');
    }
  };

  const switchOrganization = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setOrganization(org);
    }
  };

  return (
    <OrganizationContext.Provider value={{
      organization,
      organizations,
      loading,
      createOrganization,
      switchOrganization,
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}