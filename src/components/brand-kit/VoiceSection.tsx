import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { BrandKit } from '@/types/brandKit';

interface VoiceSectionProps {
  draft: Partial<BrandKit>;
  onChange: (patch: Partial<BrandKit>) => void;
}

const SUGGESTED_DESCRIPTORS = [
  'warm', 'professional', 'compassionate', 'hopeful', 'urgent',
  'inspiring', 'down-to-earth', 'authoritative', 'playful', 'mission-driven',
];

export function VoiceSection({ draft, onChange }: VoiceSectionProps) {
  const [newDescriptor, setNewDescriptor] = useState('');
  const descriptors = draft.voice_descriptors || [];

  const addDescriptor = (value: string) => {
    const v = value.trim().toLowerCase();
    if (!v || descriptors.includes(v)) return;
    onChange({ voice_descriptors: [...descriptors, v] });
    setNewDescriptor('');
  };

  const removeDescriptor = (value: string) => {
    onChange({ voice_descriptors: descriptors.filter(d => d !== value) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice & messaging</CardTitle>
        <CardDescription>
          AI-powered features (chatbot, social composer, campaign briefs) use this to match your tone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={draft.tagline || ''}
            onChange={e => onChange({ tagline: e.target.value })}
            placeholder="A short, memorable phrase that captures what you do"
            maxLength={140}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mission">Mission statement</Label>
          <Textarea
            id="mission"
            value={draft.mission_statement || ''}
            onChange={e => onChange({ mission_statement: e.target.value })}
            placeholder="One or two sentences explaining your purpose."
            rows={3}
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <Label>Voice descriptors</Label>
          <p className="text-xs text-muted-foreground">Words that describe how your brand sounds.</p>
          <div className="flex flex-wrap gap-2">
            {descriptors.map(d => (
              <Badge key={d} variant="secondary" className="gap-1">
                {d}
                <button type="button" onClick={() => removeDescriptor(d)} aria-label={`Remove ${d}`}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              value={newDescriptor}
              onChange={e => setNewDescriptor(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addDescriptor(newDescriptor);
                }
              }}
              placeholder="Add a descriptor and press Enter"
              className="max-w-xs"
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs text-muted-foreground mr-1">Suggestions:</span>
            {SUGGESTED_DESCRIPTORS.filter(s => !descriptors.includes(s)).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => addDescriptor(s)}
                className="text-xs px-2 py-0.5 rounded border border-border hover:bg-accent text-muted-foreground"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="do-use">Do use</Label>
            <Textarea
              id="do-use"
              value={draft.do_use || ''}
              onChange={e => onChange({ do_use: e.target.value })}
              placeholder="Words and phrases that fit your brand."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dont-use">Don't use</Label>
            <Textarea
              id="dont-use"
              value={draft.dont_use || ''}
              onChange={e => onChange({ dont_use: e.target.value })}
              placeholder="Words and phrases to avoid."
              rows={4}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
