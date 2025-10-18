import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMobileAppData } from './useMobileAppData';

interface RealtimeUpdate {
  type: 'user' | 'role';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
}

export function useMobileAppRealtime(organizationId: string, enabled: boolean = true) {
  const queryClient = useQueryClient();
  const { hasMobileApp, isActive } = useMobileAppData(organizationId);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null);

  useEffect(() => {
    if (!enabled || !hasMobileApp || !isActive) return;

    // Set up polling interval for updates (every 5 seconds)
    setIsConnected(true);
    
    const pollInterval = setInterval(() => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['mobile-app-users', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['mobile-app-user-roles', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['mobile-app-users-for-roles', organizationId] });
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      setIsConnected(false);
    };
  }, [organizationId, enabled, hasMobileApp, isActive, queryClient]);

  return {
    isConnected,
    lastUpdate,
  };
}
