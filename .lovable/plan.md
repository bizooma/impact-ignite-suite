
Trim the provider dropdown in `IntegrationsDashboard.tsx` to only Mailchimp and Google Business Profile.

## Change

**File:** `src/components/integrations/IntegrationsDashboard.tsx`

Replace the `availableProviders` array (currently 13 entries) with only the two working providers:

```ts
const availableProviders = [
  { value: 'mailchimp', label: 'Mailchimp' },
  { value: 'google_business', label: 'Google Business Profile' },
];
```

## Notes

- Existing integrations using other providers (if any) will still display by their raw `provider` value via the existing fallback: `availableProviders.find(...)?.label || integration.provider`. No data loss.
- Edit dialog uses the same array, so it's automatically trimmed too.
- No DB changes, no hook changes, no edge function changes.
- When Slack/HubSpot/Facebook etc. are built out end-to-end later, just add them back to this array.
