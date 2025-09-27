import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PlatformAdminContextType {
  isPlatformAdmin: boolean;
  loading: boolean;
  grantAdminAccess: (email: string) => Promise<boolean>;
  logAdminAction: (action: string, targetType?: string, targetId?: string, details?: any) => Promise<void>;
}

const PlatformAdminContext = createContext<PlatformAdminContextType | undefined>(undefined);

export function PlatformAdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPlatformAdminStatus();
  }, [user]);

  const checkPlatformAdminStatus = async () => {
    if (!user) {
      setIsPlatformAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_platform_admin')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setIsPlatformAdmin(data.is_platform_admin || false);
      }
    } catch (error) {
      console.error('Error checking platform admin status:', error);
      setIsPlatformAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const grantAdminAccess = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('grant_platform_admin', {
        _email: email
      });

      if (error) throw error;
      
      await logAdminAction('grant_admin_access', 'user', null, { target_email: email });
      return data || false;
    } catch (error) {
      console.error('Error granting admin access:', error);
      return false;
    }
  };

  const logAdminAction = async (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: any
  ) => {
    if (!user) return;

    try {
      await supabase.from('admin_audit_logs').insert({
        admin_user_id: user.id,
        action,
        target_type: targetType,
        target_id: targetId,
        details: details || {}
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  return (
    <PlatformAdminContext.Provider
      value={{
        isPlatformAdmin,
        loading,
        grantAdminAccess,
        logAdminAction,
      }}
    >
      {children}
    </PlatformAdminContext.Provider>
  );
}

export function usePlatformAdmin() {
  const context = useContext(PlatformAdminContext);
  if (context === undefined) {
    throw new Error('usePlatformAdmin must be used within a PlatformAdminProvider');
  }
  return context;
}