import { useCallback, useEffect, useState } from 'react';
import { fetchApprovedFeedback } from '../services/feedbackService.js';

export function useApprovedFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await fetchApprovedFeedback();
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
