import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Per-user, per-organization banner dismissal stored in localStorage.
 * Survives reloads but is scoped so each teammate makes their own choice.
 */
export function useDismissedBanner(bannerKey: string, organizationId: string | undefined) {
  const { user } = useAuth();
  const storageKey = user?.id && organizationId
    ? `lovable:dismissed-banner:${user.id}:${organizationId}:${bannerKey}`
    : null;

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!storageKey) return;
    try {
      setDismissed(localStorage.getItem(storageKey) === '1');
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  const dismiss = useCallback(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, [storageKey]);

  const restore = useCallback(() => {
    if (!storageKey) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setDismissed(false);
  }, [storageKey]);

  return { dismissed, dismiss, restore };
}
