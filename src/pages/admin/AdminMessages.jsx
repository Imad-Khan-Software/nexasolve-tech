import { useMemo, useState } from 'react';
import { Search, RefreshCw, MessageSquare } from 'lucide-react';
import { Loading } from '../../components/common/Loading.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { Toast } from '../../components/ui/Toast.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { useOrders } from '../../hooks/useOrders.js';
import { AdminOrderDetails } from '../../features/orders/AdminOrderDetails.jsx';
import { deleteOrder as deleteOrderRequest } from '../../services/orderService.js';

/**
 * A conversation-first view over the exact same data as AdminOrders.jsx
 * (same useOrders() hook, same AdminOrderDetails modal, same
 * deleteOrder service call) — deliberately not a second messaging
 * backend. The only real difference from the Orders page is presentation:
 * this view sorts unread-first, then most recent, and frames each row as
 * a conversation rather than an enquiry record. Sending a reply here
 * updates the exact same `messages` rows the Orders page reads, so
 * there's nothing to keep in sync — it's the same source of truth.
 */
export function AdminMessages() {
  const { orders, status, error, refetch } = useOrders();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteState, setDeleteState] = useState({ open: false, order: null, isDeleting: false });

  const conversations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      if (!query) return true;
      const haystack = [order.client_name, order.client_email, order.project_title]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    // Unread first, then most recent — the "what needs my attention"
    // ordering that makes this feel like a messages inbox rather than a
    // records table.
    return [...filtered].sort((a, b) => {
      const unreadA = a.admin_read === false ? 0 : 1;
      const unreadB = b.admin_read === false ? 0 : 1;
      if (unreadA !== unreadB) return unreadA - unreadB;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [orders, searchTerm]);

  function handleOrderChanged() {
    refetch();
  }

  function handleRequestDelete(order) {
    setSelectedOrder(null);
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
          <h1 className="font-display text-xl font-semibold text-foreground">Messages</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            All customer conversations, unread first.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={refetch}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" aria-hidden="true" />
        <label htmlFor="admin-messages-search" className="sr-only">Search conversations</label>
        <input
          id="admin-messages-search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, project…"
          className="w-full rounded-DEFAULT border border-border bg-background-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none"
        />
      </div>

      {status === 'loading' && <Loading label="Loading conversations…" />}

      {status === 'error' && (
        <ErrorState
          title="Couldn't load messages"
          message={error?.message || 'Something went wrong.'}
          onRetry={refetch}
        />
      )}

      {status === 'success' && orders.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description='Messages from the "Enquire" form on your public site will show up here.'
        />
      )}

      {status === 'success' && orders.length > 0 && conversations.length === 0 && (
        <EmptyState icon={MessageSquare} title="No conversations match your search" description="Try a different search term." />
      )}

      {status === 'success' && conversations.length > 0 && (
        <div className="space-y-2">
          {conversations.map((order) => {
            const isUnread = order.admin_read === false;
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedOrder(order)}
                className="flex w-full items-start gap-3 rounded-lg border border-border bg-background-surface p-4 text-left transition-colors hover:border-border-strong"
              >
                <div className="mt-1.5 h-2 w-2 shrink-0">
                  {isUnread && <span className="block h-2 w-2 rounded-full bg-accent" aria-label="Unread" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className={isUnread ? 'text-sm font-semibold text-foreground' : 'text-sm font-medium text-foreground-muted'}>
                      {order.client_name || 'Unknown'}
                    </span>
                    {order.created_at && (
                      <span className="shrink-0 text-xs text-foreground-subtle">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-foreground-subtle">
                    {order.project_title || 'General Inquiry'}
                  </p>
                  {order.message && (
                    <p className="mt-1 truncate text-sm text-foreground-muted">{order.message}</p>
                  )}
                </div>
              </button>
            );
          })}
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
