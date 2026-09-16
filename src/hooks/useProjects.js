import { useCallback, useEffect, useState } from 'react';
import { fetchProjects } from '../services/projectService.js';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await fetchProjects();
      setProjects(data);
      setStatus('success');
    } catch (err) {
      setError(err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { projects, status, error, refetch: load };
}
