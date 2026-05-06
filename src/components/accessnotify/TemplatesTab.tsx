import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccessNotifyTemplates } from '@/hooks/useAccessNotify';

export function TemplatesTab({ organizationId }: { organizationId: string }) {
  const { data: templates = [], isLoading } = useAccessNotifyTemplates(organizationId);

  const grouped = templates.reduce((acc: Record<string, any[]>, t: any) => {
    (acc[t.category] ||= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Templates</h2>
        <p className="text-sm text-muted-foreground">
          Reusable accessible notification templates. Starter templates are provided for common use cases.
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{category}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t: any) => (
                <Card key={t.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{t.name}</CardTitle>
                      {t.is_starter && <Badge variant="secondary" className="text-xs">Starter</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {t.plain_language_body || t.email_body}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
