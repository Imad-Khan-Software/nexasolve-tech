import { useMemo, useState } from 'react';
import { Search, RefreshCw, Inbox } from 'lucide-react';
import { Loading } from '../../components/common/Loading.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { Toast } from '../../components/ui/Toast.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { cn } from '../../lib/cn.js';
import { useOrders } from '../../hooks/useOrders.js';
import { AdminOrderDetails } from '../../features/orders/AdminOrderDetails.jsx';
import { deleteOrder as deleteOrderRequest } from '../../services/orderService.js';

const READ_FILTERS = ['All', 'Unread', 'Read'];

export function AdminOrders() {
  const { orders, status, error, refetch } = useOrders();

  const [searchTerm, setSearchTerm] = useState('');
  const [readFilter, setReadFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteState, setDeleteState] = useState({ open: false, order: null, isDeleting: false });

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      if (readFilter === 'Unread' && order.admin_read !== false) return false;
      if (readFilter === 'Read' && order.admin_read === false) return false;

      if (!query) return true;
      const haystack = [order.client_name, order.client_email, order.project_title, order.access_token]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [orders, searchTerm, readFilter]);

  function handleOrderChanged() {
    refetch();
  }

  function handleRequestDelete(order) {
    setSelectedOrder(null); // close the details modal — avoids stacking two Modal portals
    setDeleteState({ open: true, order, isDeleting: false });
  }

  function closeDeleteConfirm() {
    if (deleteState.isDeleting) return;
    setDeleteState({ open: false, order: null, isDeleting: false });
  }

  async function handleConfirmDelete() {
    if (!deleteState.order) return;
    setDeleteState((s) => ({ ...s, isDeleting: true }));
    try {
      await deleteOrderRequest(deleteState.order.id);
      setDeleteState({ open: false, order: null, isDeleting: false });
      refetch();
      setToast({ type: 'success', message: 'Enquiry deleted.' });
    } catch (err) {
      setDeleteState((s) => ({ ...s, isDeleting: false }));
      setToast({ type: 'error', message: `Delete failed: ${err.message || 'please try again.'}` });
      // eslint-disable-next-line no-console
      console.error('deleteOrder failed:', err);
    }
  }

  const currentSelected = selectedOrder
    ? orders.find((o) => o.id === selectedOrder.id) || selectedOrder
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Orders / Enquiries</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Manage customer project enquiries and conversations.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={refetch}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" aria-hidden="true" />
          <label htmlFor="admin-order-search" className="sr-only">Search enquiries</label>
          <input
            id="admin-order-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, project…"
            className="w-full rounded-DEFAULT border border-border bg-background-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex gap-2" role="group" aria-label="Filter by read status">
          {READ_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setReadFilter(f)}
              aria-pressed={readFilter === f}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                readFilter === f
                  ? 'border-transparent bg-accent text-background'
                  : 'border-border text-foreground-muted hover:border-border-strong hover:text-foreground'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {status === 'loading' && <Loading label="Loading enquiries…" />}

      {status === 'error' && (
        <ErrorState
          title="Couldn't load enquiries"
          message={error?.message || 'Something went wrong.'}
          onRetry={refetch}
        />
      )}

      {status === 'success' && orders.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="No enquiries yet"
          description='Messages from the "Enquire" form on your public site will show up here.'
        />
      )}

      {status === 'success' && orders.length > 0 && filteredOrders.length === 0 && (
        <EmptyState icon={Inbox} title="No enquiries match your search" description="Try a different search term or filter." />
      )}

      {status === 'success' && filteredOrders.length > 0 && (
        <div className="space-y-2">
          {filteredOrders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedOrder(order)}
              className="flex w-full flex-col gap-1 rounded-lg border border-border bg-background-surface p-4 text-left transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {order.admin_read === false && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" title="Unread" />
                  )}
                  <span className="truncate text-sm font-medium text-foreground">
                    {order.client_name || 'Unknown'}
                  </span>
                  <span className="truncate text-xs text-foreground-subtle">
                    — {order.project_title || 'General Inquiry'}
                  </span>
                </div>
                {order.message && (
                  <p className="mt-1 truncate text-xs text-foreground-muted">{order.message}</p>
                )}
              </div>
              {order.created_at && (
                <span className="shrink-0 text-xs text-foreground-subtle">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <AdminOrderDetails
        isOpen={Boolean(currentSelected)}
        order={currentSelected}
        onClose={() => setSelectedOrder(null)}
        onOrderChanged={handleOrderChanged}
        onToast={setToast}
        onRequestDelete={handleRequestDelete}
      />

      <ConfirmDialog
        isOpen={deleteState.open}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        isLoading={deleteState.isDeleting}
        title="Delete enquiry?"
        message={
          deleteState.order
            ? `Are you sure you want to delete the enquiry from "${deleteState.order.client_name || 'this customer'}"? This action cannot be undone.`
            : ''
        }
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
