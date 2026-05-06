import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAccessNotifySettings, useUpsertSettings } from '@/hooks/useAccessNotify';

export function SettingsTab({ organizationId }: { organizationId: string }) {
  const { data: settings, isLoading } = useAccessNotifySettings(organizationId);
  const upsert = useUpsertSettings(organizationId);

  const [form, setForm] = useState<any>({});
  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const channels = form.channels_enabled || { email: true, sms: true, voice: true };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Configure default sender info and approval requirements.</p>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Default sender</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Default sender email</Label><Input value={form.default_from_email ?? ''} onChange={(e) => set('default_from_email', e.target.value)} /></div>
              <div><Label>Default SMS number</Label><Input value={form.default_sms_number ?? ''} onChange={(e) => set('default_sms_number', e.target.value)} /></div>
              <div><Label>Default voice caller ID</Label><Input value={form.default_voice_caller_id ?? ''} onChange={(e) => set('default_voice_caller_id', e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Accessibility</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Accessibility statement link</Label><Input value={form.accessibility_statement_url ?? ''} onChange={(e) => set('accessibility_statement_url', e.target.value)} /></div>
              <div><Label>Accommodation contact email</Label><Input value={form.accommodation_contact_email ?? ''} onChange={(e) => set('accommodation_contact_email', e.target.value)} /></div>
              <div><Label>Default language</Label><Input value={form.default_language ?? 'en'} onChange={(e) => set('default_language', e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Workflow</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between">
                <span>Require approval before sending</span>
                <Switch checked={!!form.require_approval} onCheckedChange={(v) => set('require_approval', v)} />
              </label>
              <div className="space-y-2">
                <Label>Channels enabled</Label>
                {(['email', 'sms', 'voice'] as const).map((c) => (
                  <label key={c} className="flex items-center justify-between">
                    <span className="capitalize">{c}</span>
                    <Switch
                      checked={!!channels[c]}
                      onCheckedChange={(v) => set('channels_enabled', { ...channels, [c]: v })}
                    />
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending}>
            {upsert.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        </>
      )}
    </div>
  );
}
