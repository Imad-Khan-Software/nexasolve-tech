import { useEffect, useState } from 'react';
import { fetchAnalyticsRowsForVisitor } from '../services/analyticsService.js';
import { fetchEngagementRowsForVisitor } from '../services/engagementService.js';
import { totalActiveSeconds, uniqueSessionCount } from '../lib/engagementAnalytics.js';

/**
 * Compact visitor-engagement summary for the admin enquiry/chat view
 * (PART 19) — total active time, session count, page count, and the
 * device/browser/country/source of the visitor's most recent visit.
 * `analyticsVisitorId` is `orders.analytics_visitor_id` (see
 * supabase/migrations/orders_visitor_link.sql) — null for enquiries
 * submitted before this linkage existed, or if the visitor had
 * cookies/local storage disabled, in which case this returns `null`
 * data and the caller should render a "not available" fallback rather
 * than an error.
 */
export function useOrderVisitorActivity(analyticsVisitorId) {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState(analyticsVisitorId ? 'loading' : 'unavailable');

  useEffect(() => {
    if (!analyticsVisitorId) {
      setStatus('unavailable');
      setSummary(null);
      return;
    }

    let cancelled = false;
    setStatus('loading');

    Promise.all([
      fetchEngagementRowsForVisitor(analyticsVisitorId),
      fetchAnalyticsRowsForVisitor(analyticsVisitorId),
    ])
      .then(([engagementRows, analyticsRows]) => {
        if (cancelled) return;
        const latest = analyticsRows[0]; // newest-first
        const earliest = analyticsRows[analyticsRows.length - 1];
        setSummary({
          activeSeconds: totalActiveSeconds(engagementRows),
          sessions: uniqueSessionCount(engagementRows.length ? engagementRows : analyticsRows),
          pages: analyticsRows.length,
          source: earliest?.referrer || 'Direct',
          device: latest?.device_type,
          browser: latest?.browser,
          country: latest?.country,
          city: latest?.city,
        });
        setStatus('success');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [analyticsVisitorId]);

  return { summary, status };
}
