import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AccessibilityIssue } from '@/hooks/useAccessibilityScans';
import { AlertCircle, Image as ImageIcon, FormInput, Heading, Link as LinkIcon, Languages, Layers } from 'lucide-react';

const CATEGORY_META: Record<string, { label: string; icon: any; why: string }> = {
  image: { label: 'Images', icon: ImageIcon, why: 'Screen readers cannot describe images without alt text, leaving users who cannot see them without context.' },
  form: { label: 'Forms', icon: FormInput, why: 'Form fields without labels prevent assistive tech users from understanding what to enter.' },
  heading: { label: 'Headings', icon: Heading, why: 'A clear heading hierarchy helps users navigate your page and improves SEO.' },
  structure: { label: 'Page Structure', icon: Layers, why: 'Missing landmarks and titles make it harder for users to orient themselves on the page.' },
  link: { label: 'Links & Buttons', icon: LinkIcon, why: 'Empty links and buttons leave keyboard and screen-reader users unable to know what an action does.' },
  language: { label: 'Language', icon: Languages, why: 'Declaring page language helps screen readers pronounce content correctly.' },
  contrast: { label: 'Contrast', icon: AlertCircle, why: 'Low color contrast makes text difficult to read for users with low vision.' },
  other: { label: 'Other', icon: AlertCircle, why: 'Additional issues that may impact usability.' },
};

const SEVERITY_VARIANT: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-muted text-muted-foreground border-border',
};

interface Props {
  issues: AccessibilityIssue[];
}

export function SiteIssuesList({ issues }: Props) {
  if (issues.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          No issues found in the latest scan. 🎉
        </CardContent>
      </Card>
    );
  }

  const grouped = issues.reduce<Record<string, AccessibilityIssue[]>>((acc, i) => {
    (acc[i.category] = acc[i.category] || []).push(i);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, items]) => {
        const meta = CATEGORY_META[category] || CATEGORY_META.other;
        const Icon = meta.icon;
        return (
          <Card key={category}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{meta.label}</h3>
                <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Why it matters: {meta.why}</p>
              <ul className="divide-y">
                {items.map((i) => (
                  <li key={i.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{i.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{i.recommendation}</p>
                        {i.element_snippet && (
                          <code className="block mt-2 text-xs bg-muted p-2 rounded break-all">{i.element_snippet}</code>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded border capitalize ${SEVERITY_VARIANT[i.severity]}`}>
                        {i.severity}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
