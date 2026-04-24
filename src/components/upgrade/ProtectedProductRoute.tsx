import { useProductAccess, ProductId } from '@/hooks/useProductAccess';
import { UpgradePrompt } from './UpgradePrompt';

interface ProtectedProductRouteProps {
  productId: ProductId;
  productName: string;
  description: string;
  features: string[];
  children: React.ReactNode;
}

export function ProtectedProductRoute({
  productId,
  productName,
  description,
  features,
  children
}: ProtectedProductRouteProps) {
  const { hasAccess } = useProductAccess();

  if (!hasAccess(productId)) {
    return (
      <UpgradePrompt
        productId={productId}
        productName={productName}
        description={description}
        features={features}
      />
    );
  }

  return <>{children}</>;
}
