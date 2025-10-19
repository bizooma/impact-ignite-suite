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
            purchased_products
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
      let org: Organization;
      let isNewOrg = true;

      // If mobile app code is provided, check if organization already exists
      if (mobileAppCode) {
        const { data: existingOrg, error: lookupError } = await supabase
          .from('organizations')
          .select('*')
          .eq('mobile_app_code', mobileAppCode)
          .maybeSingle();

        if (lookupError) throw lookupError;

        if (existingOrg) {
          // Organization exists, check if user is already a member
          const { data: existingMembership } = await supabase
            .from('memberships')
            .select('*')
            .eq('user_id', user.id)
            .eq('organization_id', existingOrg.id)
            .maybeSingle();

          if (existingMembership) {
            toast.error(`You're already a member of ${existingOrg.name}`);
            await fetchOrganizations();
            setOrganization({
              ...existingOrg,
              purchased_products: Array.isArray(existingOrg.purchased_products)
                ? existingOrg.purchased_products as string[]
                : []
            } as Organization);
            return;
          }

          // Join existing organization as admin
          org = {
            ...existingOrg,
            purchased_products: Array.isArray(existingOrg.purchased_products)
              ? existingOrg.purchased_products as string[]
              : []
          } as Organization;
          isNewOrg = false;

          const { error: membershipError } = await supabase
            .from('memberships')
            .insert([{
              user_id: user.id,
              organization_id: org.id,
              role: 'admin' // Subsequent users are admins
            }]);

          if (membershipError) throw membershipError;

          toast.success(`Joined ${org.name} as admin!`);
          await fetchOrganizations();
          setOrganization(org);
          return;
        }
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