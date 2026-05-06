import { Card, CardContent } from '@/components/ui/card';
import { useAccessNotifyPreferences } from '@/hooks/useAccessNotify';

export function ContactPreferencesTab({ organizationId }: { organizationId: string }) {
  const { data: prefs = [], isLoading } = useAccessNotifyPreferences(organizationId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Contact preferences</h2>
        <p className="text-sm text-muted-foreground">
          Accessibility and communication preferences are applied automatically when sending campaigns.
          Manage individual preferences from any contact's profile in CRM.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : prefs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">No contact preferences set yet.</p>
              <p className="text-sm text-muted-foreground">
                Open a CRM contact to set their preferred channel, language, and accommodation needs.
                Until preferences are set, the default channels selected on each campaign are used.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{prefs.length} contact(s) with custom preferences.</p>
              {/* A future iteration will join with crm_contacts and render a full table here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
