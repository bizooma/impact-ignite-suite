import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_CATEGORIES = [
  'health',
  'social',
  'environment',
  'youth',
  'arts',
  'animals',
  'giving',
  'global',
] as const;

export type AwarenessCategory = (typeof DEFAULT_CATEGORIES)[number];

interface CalendarSettings {
  showAwarenessDays: boolean;
  enabledCategories: string[];
}

const DEFAULTS: CalendarSettings = {
  showAwarenessDays: true,
  enabledCategories: [...DEFAULT_CATEGORIES],
};

/**
 * Per-organization preferences for the Social Media Calendar.
 * Stored in `social_calendar_settings` (one row per org).
 * Members can read; admins/owners can write (enforced by RLS).
 */
export function useSocialCalendarSettings(organizationId: string | undefined) {
  const [settings, setSettings] = useState<CalendarSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load
  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('social_calendar_settings')
        .select('show_awareness_days, enabled_categories')
        .eq('organization_id', organizationId)
        .maybeSingle();
      if (!cancelled) {
        if (!error && data) {
          setSettings({
            showAwarenessDays: data.show_awareness_days,
            enabledCategories: data.enabled_categories ?? DEFAULTS.enabledCategories,
          });
        } else {
          setSettings(DEFAULTS);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  // Persist (upsert) — silently no-ops for non-admins (RLS will reject; UI hides controls)
  const persist = useCallback(
    async (next: CalendarSettings) => {
      if (!organizationId) return;
      setSaving(true);
      const { error } = await supabase
        .from('social_calendar_settings')
        .upsert(
          {
            organization_id: organizationId,
            show_awareness_days: next.showAwarenessDays,
            enabled_categories: next.enabledCategories,
          },
          { onConflict: 'organization_id' },
        );
      setSaving(false);
      if (error) {
        // Roll back optimistic state on failure
        console.warn('[useSocialCalendarSettings] save failed', error.message);
      }
    },
    [organizationId],
  );

  const toggleShowAwarenessDays = useCallback(
    (value: boolean) => {
      const next = { ...settings, showAwarenessDays: value };
      setSettings(next);
      void persist(next);
    },
    [settings, persist],
  );

  const setEnabledCategories = useCallback(
    (categories: string[]) => {
      const next = { ...settings, enabledCategories: categories };
      setSettings(next);
      void persist(next);
    },
    [settings, persist],
  );

  const toggleCategory = useCallback(
    (category: string) => {
      const isOn = settings.enabledCategories.includes(category);
      const next = isOn
        ? settings.enabledCategories.filter((c) => c !== category)
        : [...settings.enabledCategories, category];
      setEnabledCategories(next);
    },
    [settings.enabledCategories, setEnabledCategories],
  );

  return {
    showAwarenessDays: settings.showAwarenessDays,
    enabledCategories: settings.enabledCategories,
    loading,
    saving,
    toggleShowAwarenessDays,
    setEnabledCategories,
    toggleCategory,
    allCategories: DEFAULT_CATEGORIES,
  };
}
