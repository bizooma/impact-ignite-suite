import { useOrganization } from './useOrganization';

export type ProductId = 
  | 'mobile_app'
  | 'chatbots'
  | 'qr_codes'
  | 'social_media'
  | 'seo_audits'
  | 'google_business'
  | 'tasks'
  | 'analytics';

export function useProductAccess() {
  const { organization } = useOrganization();
  
  const hasAccess = (productId: ProductId): boolean => {
    if (!organization) return false;
    const products = organization.purchased_products || [];
    return products.includes(productId);
  };

  const hasAnyProduct = (): boolean => {
    if (!organization) return false;
    const products = organization.purchased_products || [];
    return products.length > 0;
  };

  return { hasAccess, hasAnyProduct };
}
