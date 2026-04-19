import { useState } from 'react';
import { useMobileApiSettings } from '@/hooks/useMobileApiSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Eye, EyeOff, Key, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const FUNCTIONS_BASE = `https://svuxuhrsrawdqqkepeye.supabase.co/functions/v1`;

interface Props {
  organizationId: string;
}

export function MobileApiSettings({ organizationId }: Props) {
  const { data, isLoading, generateKey, setEnabled } = useMobileApiSettings(organizationId);
  const [showKey, setShowKey] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;

  const key = data?.mobile_api_key;
  const enabled = !!data?.mobile_api_enabled;
  const masked = key ? `${key.slice(0, 13)}${'•'.repeat(20)}${key.slice(-4)}` : '';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" /> Mobile API Key
          </CardTitle>
          <CardDescription>
            Used by your mobile app (e.g. Dreamflow) to authenticate with this organization. Keep it secret.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Mobile API enabled</Label>
              <p className="text-xs text-muted-foreground">When off, all mobile endpoints reject requests.</p>
            </div>
            <Switch checked={enabled} onCheckedChange={(v) => setEnabled.mutate(v)} disabled={!key} />
          </div>

          {!key ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No mobile API key generated yet. Generate one to start integrating your mobile app.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input readOnly value={showKey ? key : masked} className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => copy(key, 'API key')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {!confirming ? (
              <Button
                variant={key ? 'outline' : 'default'}
                onClick={() => (key ? setConfirming(true) : generateKey.mutate())}
                disabled={generateKey.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {key ? 'Regenerate Key' : 'Generate Key'}
              </Button>
            ) : (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    generateKey.mutate();
                    setConfirming(false);
                  }}
                >
                  Yes, regenerate (old key stops working)
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endpoint Reference</CardTitle>
          <CardDescription>
            Base URL: <code className="text-xs">{FUNCTIONS_BASE}</code>
            <br />
            Required header: <code className="text-xs">x-mobile-api-key: &lt;your key&gt;</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="events">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="rsvp">RSVP</TabsTrigger>
              <TabsTrigger value="stories">Stories</TabsTrigger>
              <TabsTrigger value="donate">Donate</TabsTrigger>
              <TabsTrigger value="volunteer">Volunteer</TabsTrigger>
            </TabsList>

            <TabsContent value="events">
              <EndpointDoc
                method="GET"
                path="/mobile-events"
                desc="List published upcoming events. Optional: ?include_past=true&limit=20"
                example={`{
  "events": [
    {
      "id": "uuid",
      "title": "Summer Gala",
      "description": "Join us...",
      "location": "Austin, TX",
      "starts_at": "2026-06-01T18:00:00Z",
      "ends_at": "2026-06-01T22:00:00Z",
      "image_url": "https://...",
      "capacity": 200
    }
  ]
}`}
              />
            </TabsContent>

            <TabsContent value="rsvp">
              <EndpointDoc
                method="POST"
                path="/mobile-events-rsvp"
                desc="Submit an RSVP for an event."
                example={`// Request
{
  "event_id": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+15551234567",
  "guests": 2,
  "notes": "Vegetarian"
}

// Response
{ "success": true, "rsvp_id": "uuid" }`}
              />
            </TabsContent>

            <TabsContent value="stories">
              <EndpointDoc
                method="GET"
                path="/mobile-stories"
                desc="List published success stories. Optional: ?featured=true, ?slug=foo, ?limit=10"
                example={`{
  "stories": [
    {
      "id": "uuid",
      "title": "Lives Changed",
      "slug": "lives-changed",
      "summary": "...",
      "body": "# Markdown body...",
      "hero_image_url": "https://...",
      "gallery": [],
      "video_url": null,
      "category": "Impact",
      "tags": ["youth"],
      "author_name": "Staff",
      "is_featured": true,
      "published_at": "2026-04-01T00:00:00Z"
    }
  ]
}`}
              />
            </TabsContent>

            <TabsContent value="donate">
              <EndpointDoc
                method="POST"
                path="/mobile-donate"
                desc="Record a donation. Creates/links contact by email and writes to CRM."
                example={`// Request
{
  "amount": 100.00,
  "currency": "USD",
  "email": "donor@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+15551234567",
  "is_recurring": false,
  "payment_method": "stripe",
  "transaction_id": "ch_123",
  "notes": "From mobile app"
}

// Response
{
  "success": true,
  "donation_id": "uuid",
  "contact_id": "uuid",
  "status": "recorded"
}`}
              />
            </TabsContent>

            <TabsContent value="volunteer">
              <EndpointDoc
                method="POST"
                path="/mobile-volunteer"
                desc="Submit a volunteer sign-up or hours log."
                example={`// Request
{
  "email": "vol@example.com",
  "first_name": "Sam",
  "last_name": "Lee",
  "phone": "+15551234567",
  "activity": "Event setup",
  "hours": 3,
  "volunteer_date": "2026-05-15",
  "location": "Main campus",
  "days": ["Saturday", "Sunday"]
}

// Response
{
  "success": true,
  "contact_id": "uuid",
  "volunteer_hours_id": "uuid"
}`}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function EndpointDoc({ method, path, desc, example }: { method: string; path: string; desc: string; example: string }) {
  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded text-xs font-bold ${method === 'GET' ? 'bg-primary/10 text-primary' : 'bg-accent text-accent-foreground'}`}>
          {method}
        </span>
        <code className="text-sm">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground">{desc}</p>
      <pre className="bg-muted text-muted-foreground rounded-md p-3 text-xs overflow-x-auto">
        <code>{example}</code>
      </pre>
    </div>
  );
}
