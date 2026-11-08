import { useLayoutEffect } from 'react';
import { createShareURL } from '../../core/codec';
import type { Locale } from '../../i18n';
import type { Journey } from './storage';

export function localJourneyId() {
  const state = history.state?.whatsdemoJourney;
  return state?.hash === location.hash && typeof state.id === 'string' ? state.id : undefined;
}

export function setJourneyAddress(id: string, hash: string) {
  const url = new URL(location.href);
  url.hash = hash;
  history.replaceState({ ...history.state, whatsdemoJourney: { id, hash: url.hash } }, '', url);
}

export function useLiveJourneyLink(
  journey: Journey,
  local: boolean,
  blocked: boolean,
  locale: Locale,
) {
  useLayoutEffect(() => {
    if (!local) return;
    try {
      if (localJourneyId() !== journey.id) setJourneyAddress(journey.id, location.hash);
    } catch {
      // Some portable browser contexts restrict history access.
    }
    if (blocked || !journey.project.steps.length) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const link = await createShareURL(journey.project, 'editor', location.href, locale);
        if (!cancelled && localJourneyId() === journey.id)
          setJourneyAddress(journey.id, new URL(link).hash);
      } catch {
        // Keep the last shareable snapshot when the project or URL exceeds codec limits.
      }
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [journey.id, journey.project, local, blocked, locale]);
}
