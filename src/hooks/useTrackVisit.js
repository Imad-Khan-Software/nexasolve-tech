import { useCallback, useRef } from 'react';
import { recordVisit } from '../services/visitorService.js';

/**
 * Returns a stable function that records a visit for a given service
 * name, guarded so the exact same service can't be recorded twice in a
 * row from accidental double-firing (e.g. React StrictMode's dev-only
 * double-invoke, or a double click). Deliberately NOT a "track on
 * mount/render" effect — this project has no per-project route to mount
 * on, so tracking is tied to genuine interactions (View Demo / Enquire
 * clicks) instead, which can never fire merely from a re-render.
 */
export function useTrackVisit() {
  const lastTrackedRef = useRef(null);
  const lastTrackedAtRef = useRef(0);

  return useCallback((serviceName) => {
    if (!serviceName) return;
    const now = Date.now();
    // Same service tracked again within 2s is almost certainly a
    // duplicate event, not a new intentional visit — ignore it.
    if (lastTrackedRef.current === serviceName && now - lastTrackedAtRef.current < 2000) {
      return;
    }
    lastTrackedRef.current = serviceName;
    lastTrackedAtRef.current = now;
    recordVisit(serviceName);
  }, []);
}
