import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';

interface UpgradePromptProps {
  productName: string;
  description: string;
  features: string[];
}

export function UpgradePrompt({ productName, description, features }: UpgradePromptProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Upgrade to Access {productName}</CardTitle>
          <p className="text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                What you'll get:
              </h4>
              <ul className="space-y-2">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button className="w-full" size="lg">
              Contact Sales to Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
