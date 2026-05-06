import { useOrganization } from './useOrganization';
import { usePlatformAdmin } from './usePlatformAdmin';

export type ProductId =
  | 'mobile_app'
  | 'chatbots'
  | 'qr_codes'
  | 'social_media'
  | 'seo_audits'
  | 'google_business'
  | 'tasks'
  | 'analytics'
  | 'crm'
  | 'campaigns'
  | 'accessibility'
  | 'accessnotify';

export const ALL_PRODUCTS: { id: ProductId; label: string }[] = [
  { id: 'mobile_app', label: 'Mobile App' },
  { id: 'chatbots', label: 'Chatbots' },
  { id: 'qr_codes', label: 'QR Codes' },
  { id: 'social_media', label: 'Social Media' },
  { id: 'seo_audits', label: 'SEO Audits' },
  { id: 'google_business', label: 'Google Business' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'crm', label: 'CRM' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'accessnotify', label: 'AccessNotify' },
];

export function useProductAccess() {
  const { organization } = useOrganization();
  const { isPlatformAdmin } = usePlatformAdmin();

  const hasAccess = (productId: ProductId): boolean => {
    if (isPlatformAdmin) return true;
    if (!organization) return false;
    const products = organization.purchased_products || [];
    return products.includes(productId);
  };

  const hasAnyProduct = (): boolean => {
    if (isPlatformAdmin) return true;
    if (!organization) return false;
    const products = organization.purchased_products || [];
    return products.length > 0;
  };

  return { hasAccess, hasAnyProduct };
}
