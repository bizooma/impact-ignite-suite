import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function AccessibilityStatement() {
  const { siteId } = useParams<{ siteId: string }>();
  const [text, setText] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!siteId) return;
      const { data: site } = await supabase
        .from('accessibility_sites' as any)
        .select('id, business_name, domain')
        .eq('site_id', siteId)
        .maybeSingle();
      if (cancelled) return;
      if (!site) { setNotFound(true); setLoading(false); return; }
      setName((site as any).business_name || (site as any).domain);
      const { data: settings } = await supabase
        .from('accessibility_settings' as any)
        .select('statement_text')
        .eq('site_id', (site as any).id)
        .maybeSingle();
      if (cancelled) return;
      setText((settings as any)?.statement_text || null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [siteId]);

  if (loading) return <div className="max-w-2xl mx-auto p-8"><Skeleton className="h-96" /></div>;
  if (notFound) return <div className="max-w-2xl mx-auto p-8"><h1 className="text-2xl font-bold">Statement not found</h1></div>;

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Accessibility Statement</h1>
      <article className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
        {text || `${name} is committed to making this website accessible to everyone, including people with disabilities. We are continually working to improve the experience.`}
      </article>
    </main>
  );
}
