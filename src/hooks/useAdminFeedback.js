import { useCallback, useEffect, useState } from 'react';
import { fetchAllFeedback } from '../services/feedbackService.js';

export function useAdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await fetchAllFeedback();
      setFeedback(data);
      setStatus('success');
    } catch (err) {
      setError(err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { feedback, status, error, refetch: load };
}
