import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, Save, Check } from 'lucide-react';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Props {
  siteId: string;
  domain: string;
  businessName?: string | null;
}

const defaultStatement = (name: string) => `Accessibility Statement for ${name}

We are committed to improving the accessibility and usability of our website for all visitors, including people with disabilities. We make ongoing efforts to enhance the user experience and to address accessibility issues as they are identified.

Measures we take include:
- Reviewing the website for common accessibility issues on a regular basis.
- Providing an accessibility enhancement layer that gives visitors tools to adjust contrast, text size, motion, spacing, and link visibility.
- Acting on user feedback to continue improving accessibility over time.

This is an ongoing effort. We do not claim full conformance with any specific accessibility standard, but we are working continuously to improve.

Feedback
If you encounter accessibility barriers on our site, please contact us so we can address them.`;

export function SiteStatementPanel({ siteId, domain, businessName }: Props) {
  const { settings, update } = useAccessibilitySettings(siteId);
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (settings) {
      setText(settings.statement_text || defaultStatement(businessName || domain));
    }
  }, [settings, domain, businessName]);

  const save = async () => {
    await update({ statement_text: text });
  };

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Statement copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold">Accessibility Statement</h3>
          <p className="text-xs text-muted-foreground">
            Auto-generated with non-guarantee language. Edit to fit your organization, then copy to your site.
          </p>
        </div>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={14} className="font-mono text-xs" />
        <div className="flex gap-2">
          <Button onClick={save} size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied' : 'Copy to clipboard'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
