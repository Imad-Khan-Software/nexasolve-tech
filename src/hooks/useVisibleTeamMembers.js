import { useCallback, useEffect, useState } from 'react';
import { fetchVisibleTeamMembers } from '../services/teamService.js';

export function useVisibleTeamMembers() {
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await fetchVisibleTeamMembers();
      setMembers(data);
      setStatus('success');
    } catch (err) {
      setError(err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { members, status, error, refetch: load };
}
