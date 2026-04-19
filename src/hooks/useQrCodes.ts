import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isQuotaError } from '@/hooks/useTierLimits';
import type { Database } from '@/integrations/supabase/types';

type QrCode = Database['public']['Tables']['qr_codes']['Row'];
type QrScan = Database['public']['Tables']['qr_scans']['Row'];

export const useQrCodes = (organizationId?: string) => {
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchQrCodes = async () => {
    if (!organizationId) return;
    
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          *,
          qr_scans (count)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include scan count
      const qrCodesWithScans = (data || []).map(qr => ({
        ...qr,
        scan_count: qr.qr_scans?.[0]?.count || 0
      }));
      
      setQrCodes(qrCodesWithScans as any);
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch QR codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createQrCode = async (qrData: {
    name: string;
    destination_url: string;
    type?: 'static' | 'dynamic';
    brand_config?: any;
    utm_params?: any;
  }) => {
    if (!organizationId) return null;

    try {
      // Call edge function to generate QR code
      const { data, error } = await supabase.functions.invoke('generate-qr', {
        body: {
          name: qrData.name,
          destinationUrl: qrData.destination_url,
          type: qrData.type || 'dynamic',
          organizationId,
          brandConfig: qrData.brand_config || {},
          utmParams: qrData.utm_params || {}
        }
      });

      if (error) throw error;

      // The edge function already creates the QR code record
      const newQrCode = data.qrCode;
      setQrCodes(prev => [newQrCode, ...prev]);
      
      toast({
        title: "Success",
        description: "QR code created successfully",
      });

      return { qrCode: newQrCode, qrCodeSvg: data.qrCodeSvg };
    } catch (error: any) {
      console.error('Error creating QR code:', error);
      // Edge function may wrap the trigger error; check both message and context
      const ctxMsg = error?.context?.error || error?.message || '';
      const quotaMsg = isQuotaError(error)
        ?? (typeof ctxMsg === 'string' && ctxMsg.includes('quota_exceeded')
            ? ctxMsg.replace(/^.*quota_exceeded:\s*/, '')
            : null);
      toast({
        title: quotaMsg ? "Plan limit reached" : "Error",
        description: quotaMsg ?? "Failed to create QR code",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateQrCode = async (qrCodeId: string, updates: Partial<QrCode>) => {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .update(updates)
        .eq('id', qrCodeId)
        .select()
        .single();

      if (error) throw error;

      setQrCodes(prev => prev.map(qr => 
        qr.id === qrCodeId ? { ...qr, ...data } : qr
      ));

      toast({
        title: "Success",
        description: "QR code updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to update QR code",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteQrCode = async (qrCodeId: string) => {
    try {
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', qrCodeId);

      if (error) throw error;

      setQrCodes(prev => prev.filter(qr => qr.id !== qrCodeId));
      
      toast({
        title: "Success",
        description: "QR code deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting QR code:', error);
      toast({
        title: "Error",
        description: "Failed to delete QR code",
        variant: "destructive",
      });
    }
  };

  const getQrScans = async (qrCodeId: string): Promise<QrScan[]> => {
    try {
      const { data, error } = await supabase
        .from('qr_scans')
        .select('*')
        .eq('qr_code_id', qrCodeId)
        .order('scanned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching QR scans:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchQrCodes();
  }, [organizationId]);

  return {
    qrCodes,
    loading,
    createQrCode,
    updateQrCode,
    deleteQrCode,
    getQrScans,
    refetch: fetchQrCodes
  };
};