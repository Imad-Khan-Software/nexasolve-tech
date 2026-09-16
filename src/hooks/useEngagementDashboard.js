import { useCallback, useEffect, useState } from 'react';
import { fetchAnalyticsRows, fetchVisitorDirectory } from '../services/analyticsService.js';
import { fetchEngagementRows } from '../services/engagementService.js';

/**
 * Fetches the three raw inputs the engagement dashboard (PARTS 9-15)
 * aggregates client-side: engagement rows (active time), analytics rows
 * (for traffic-source join + existing page-view counts), and the
 * visitor directory (for stable "Client N" labels). Aggregation itself
 * lives in lib/engagementAnalytics.js and is done in the component, same
 * split as the existing useAnalytics()/AdminAnalytics.jsx pair.
 */
export function useEngagementDashboard(filterKey, customRange) {
  const [engagementRows, setEngagementRows] = useState([]);
  const [analyticsRows, setAnalyticsRows] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const [engagement, analytics, dir] = await Promise.all([
        fetchEngagementRows(filterKey, customRange),
        fetchAnalyticsRows(filterKey, customRange),
        fetchVisitorDirectory(),
      ]);
      setEngagementRows(engagement);
      setAnalyticsRows(analytics);
      setDirectory(dir);
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

  return { engagementRows, analyticsRows, directory, status, error, refetch: load };
}
