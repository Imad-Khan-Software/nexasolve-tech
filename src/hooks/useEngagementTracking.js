import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageEngagement, stopPageEngagement } from '../lib/engagementTracking.js';

/**
 * Starts/stops active time-on-page tracking on every public route
 * change. Mirrors usePageViewTracking.js's /admin exclusion (analytics
 * should reflect public visitors, not the site owner's own admin
 * usage) and its "start of app" placement in App.jsx.
 *
 * Route-change handling: the previous page's PageEngagementTracker is
 * stopped (final duration flushed) and a new one is started for the new
 * path every time `location.pathname` changes — this is what turns a
 * SPA navigation from Home to /projects into two separate, correctly
 * durationed engagement rows instead of one that silently keeps ticking
 * against the wrong page.
 */
export function useEngagementTracking() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      stopPageEngagement();
      return undefined;
    }

    trackPageEngagement(location.pathname);

    return () => {
      // No-op on cleanup for the *same* path — trackPageEngagement()
      // itself stops the previous tracker before starting a new one, so
      // stopping here too would double-flush. Only the unmount of the
      // whole app (which never really happens for a SPA tab) or a
      // path change matters, and both are already handled by
      // trackPageEngagement's own stop-then-start and by the
      // pagehide/beforeunload listeners inside engagementTracking.js.
    };
  }, [location.pathname]);
}
