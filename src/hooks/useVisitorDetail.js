import { useCallback, useEffect, useState } from 'react';
import { fetchAnalyticsRowsForVisitor, fetchVisitorDirectory } from '../services/analyticsService.js';
import { fetchEngagementRowsForVisitor } from '../services/engagementService.js';

/**
 * All-time data for a single visitor's detail page (PART 8). Fetches
 * are bounded to one visitor_id, so no pagination/row-limit concerns.
 */
export function useVisitorDetail(visitorId) {
  const [engagementRows, setEngagementRows] = useState([]);
  const [analyticsRows, setAnalyticsRows] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!visitorId) return;
    setStatus('loading');
    setError(null);
    try {
      const [engagement, analytics, dir] = await Promise.all([
        fetchEngagementRowsForVisitor(visitorId),
        fetchAnalyticsRowsForVisitor(visitorId),
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
  }, [visitorId]);

  useEffect(() => {
    load();
  }, [load]);

  return { engagementRows, analyticsRows, directory, status, error, refetch: load };
}
