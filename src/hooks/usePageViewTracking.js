import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { recordPageView } from '../services/analyticsService.js';

/**
 * Tracks the initial page view and every subsequent React Router
 * navigation (no full page reload needed — this reacts to
 * `location.pathname`, which react-router-dom updates on every route
 * change). Deliberately skips /admin/* — analytics should reflect
 * public visitors, not the site owner's own admin usage.
 *
 * The lastTrackedPath ref is what prevents duplicate events: React 18
 * StrictMode double-invokes effects in dev (mount → cleanup → mount),
 * but the ref persists across that double-invoke since it's the same
 * component instance, so the second invocation sees the path already
 * recorded and skips it — same guard style as useTrackVisit.js.
 */
export function usePageViewTracking() {
  const location = useLocation();
  const lastTrackedPath = useRef(null);

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    if (lastTrackedPath.current === location.pathname) return;
    lastTrackedPath.current = location.pathname;
    recordPageView(location.pathname);
  }, [location.pathname]);
}
