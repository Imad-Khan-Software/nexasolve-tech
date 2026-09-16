import { useCallback, useEffect, useState } from 'react';
import { fetchOrders } from '../services/orderService.js';

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await fetchOrders();
      setOrders(data);
      setStatus('success');
    } catch (err) {
      setError(err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { orders, status, error, refetch: load };
}
