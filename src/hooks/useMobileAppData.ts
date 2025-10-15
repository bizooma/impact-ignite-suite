import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MobileAppDatabase {
  id: string;
  organization_id: string;
  organization_code: string;
  database_name: string;
  supabase_url: string;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: any;
}

interface ProxyOperation {
  operation: 'select' | 'insert' | 'update' | 'delete' | 'count' | 'upsert';
  table: string;
  data?: any;
  filters?: Record<string, any>;
  columns?: string;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

export function useMobileAppData(organizationId: string) {
  const queryClient = useQueryClient();

  // Fetch mobile app database configuration
  const { data: dbConfig, isLoading: configLoading } = useQuery({
    queryKey: ['mobile-app-db', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mobile_app_databases')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;
      return data as MobileAppDatabase | null;
    },
    enabled: !!organizationId,
  });

  // Execute mobile app database operations
  const executeMutation = useMutation({
    mutationFn: async (operation: ProxyOperation) => {
      const { data, error } = await supabase.functions.invoke('mobile-app-proxy', {
        body: {
          ...operation,
          organizationId,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Operation failed');
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['mobile-app-data', organizationId, variables.table] 
      });
      
      if (variables.operation !== 'select' && variables.operation !== 'count') {
        toast.success('Operation completed successfully');
      }
    },
    onError: (error: any) => {
      console.error('Mobile app operation error:', error);
      toast.error(error.message || 'Operation failed');
    },
  });

  // Fetch data from a specific table
  const fetchTableData = async (
    table: string,
    options?: {
      filters?: Record<string, any>;
      columns?: string;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    }
  ) => {
    return executeMutation.mutateAsync({
      operation: 'select',
      table,
      ...options,
    });
  };

  // Insert data into a table
  const insertData = async (table: string, data: any) => {
    return executeMutation.mutateAsync({
      operation: 'insert',
      table,
      data,
    });
  };

  // Update data in a table
  const updateData = async (table: string, data: any, filters: Record<string, any>) => {
    return executeMutation.mutateAsync({
      operation: 'update',
      table,
      data,
      filters,
    });
  };

  // Delete data from a table
  const deleteData = async (table: string, filters: Record<string, any>) => {
    return executeMutation.mutateAsync({
      operation: 'delete',
      table,
      filters,
    });
  };

  // Upsert data
  const upsertData = async (table: string, data: any) => {
    return executeMutation.mutateAsync({
      operation: 'upsert',
      table,
      data,
    });
  };

  // Get row count
  const getCount = async (table: string, filters?: Record<string, any>) => {
    return executeMutation.mutateAsync({
      operation: 'count',
      table,
      filters,
    });
  };

  return {
    dbConfig,
    configLoading,
    hasMobileApp: !!dbConfig,
    isActive: dbConfig?.is_active ?? false,
    fetchTableData,
    insertData,
    updateData,
    deleteData,
    upsertData,
    getCount,
    isExecuting: executeMutation.isPending,
  };
}
