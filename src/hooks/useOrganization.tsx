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
            mobile_app_code
          )
        `)
        .eq('user_id', user?.id);

      if (memberships) {
        const orgs = memberships
          .map(m => m.organizations)
          .filter(Boolean) as Organization[];
        
        setOrganizations(orgs);
        
        // Set first org as current if none selected
        if (orgs.length > 0 && !organization) {
          setOrganization(orgs[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async (name: string, slug: string, mobileAppCode?: string) => {
    if (!user) return;

    try {
      // Create organization
      const orgData: any = { name, slug };
      
      // If mobile app code is provided, add it
      if (mobileAppCode) {
        orgData.mobile_app_code = mobileAppCode;
        orgData.has_mobile_app = true;
      }
      
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([orgData])
        .select()
        .single();

      if (orgError) throw orgError;

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

      // Create membership
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert([{
          user_id: user.id,
          organization_id: org.id,
          role: 'owner'
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