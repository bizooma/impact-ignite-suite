import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { ALL_PRODUCTS, type ProductId } from '@/hooks/useProductAccess';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { toast } from 'sonner';

interface Props {
  organizationId: string;
  organizationName: string;
}

export function OrgProductAccessManager({ organizationId, organizationName }: Props) {
  const { logAdminAction } = usePlatformAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState<Set<ProductId>>(new Set());
  const [original, setOriginal] = useState<Set<ProductId>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('purchased_products')
        .eq('id', organizationId)
        .single();
      if (cancelled) return;
      if (error) {
        toast.error('Failed to load product access');
      } else {
        const list = Array.isArray(data?.purchased_products) ? (data!.purchased_products as ProductId[]) : [];
        setEnabled(new Set(list));
        setOriginal(new Set(list));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [organizationId]);

  const toggle = (id: ProductId, on: boolean) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  };

  const dirty = enabled.size !== original.size || [...enabled].some((p) => !original.has(p));

  const save = async () => {
    setSaving(true);
    try {
      const products = [...enabled];
      const { error } = await supabase
        .from('organizations')
        .update({ purchased_products: products })
        .eq('id', organizationId);
      if (error) throw error;
      await logAdminAction('update_product_access', 'organization', organizationId, { products });
      setOriginal(new Set(enabled));
      toast.success(`Updated product access for ${organizationName}`);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading product access…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">Platform Admin Override</h4>
        <p className="text-xs text-muted-foreground">
          Toggle which products this organization has access to. Bypasses billing — use for trials, partnerships, or comp accounts.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ALL_PRODUCTS.map((p) => (
          <label
            key={p.id}
            className="flex items-center justify-between rounded-md border p-2.5 cursor-pointer hover:bg-muted/40"
          >
            <Label htmlFor={`prod-${p.id}`} className="text-sm cursor-pointer">{p.label}</Label>
            <Switch
              id={`prod-${p.id}`}
              checked={enabled.has(p.id)}
              onCheckedChange={(v) => toggle(p.id, v)}
            />
          </label>
        ))}
      </div>
      <div className="flex justify-end pt-1">
        <Button onClick={save} disabled={!dirty || saving} size="sm">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
