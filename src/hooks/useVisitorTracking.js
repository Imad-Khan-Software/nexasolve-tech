import { useCallback, useEffect, useState } from 'react';
import { fetchVisitorTracking } from '../services/visitorService.js';

export function useVisitorTracking() {
  const [visitors, setVisitors] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await fetchVisitorTracking();
      setVisitors(data);
      setStatus('success');
    } catch (err) {
      setError(err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { visitors, status, error, refetch: load };
}
