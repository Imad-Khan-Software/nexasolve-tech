import { useCallback, useEffect, useState } from 'react';
import { fetchAnalyticsOverview, fetchAnalyticsRows } from '../services/analyticsService.js';

/**
 * `customRange` (`{ start, end }`, both 'YYYY-MM-DD') is only consulted
 * when filterKey === 'custom' — see resolveDateRange() in
 * analyticsService.js. `fetchAnalyticsOverview()` is intentionally left
 * as-is (its all-time/today/week/month cards are not filter-dependent
 * in the existing implementation), so Custom Range affects `rows` (and,
 * via EngagementSection's own useEngagementDashboard call, the
 * engagement stats) without touching that pre-existing behavior.
 */
export function useAnalytics(filterKey, customRange) {
  const [overview, setOverview] = useState(null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const [overviewData, rowsData] = await Promise.all([
        fetchAnalyticsOverview(),
        fetchAnalyticsRows(filterKey, customRange),
      ]);
      setOverview(overviewData);
      setRows(rowsData);
      setStatus('success');
    } catch (err) {
      setError(err);
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, customRange?.start, customRange?.end]);

  useEffect(() => {
    load();
  }, [load]);

  return { overview, rows, status, error, refetch: load };
}
