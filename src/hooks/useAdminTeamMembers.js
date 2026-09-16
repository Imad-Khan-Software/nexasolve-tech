import { useCallback, useEffect, useState } from 'react';
import { fetchAllTeamMembers } from '../services/teamService.js';

export function useAdminTeamMembers() {
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await fetchAllTeamMembers();
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
