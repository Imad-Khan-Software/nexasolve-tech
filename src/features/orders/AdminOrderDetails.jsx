import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ExternalLink, Send, Eye, EyeOff, Trash2, Activity } from 'lucide-react';
import { Modal } from '../../components/modal/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Loading } from '../../components/common/Loading.jsx';
import {
  fetchOrderMessages,
  sendAdminReply,
  markOrderRead,
  markOrderUnread,
  subscribeToOrderMessages,
} from '../../services/orderService.js';
import { useOrderVisitorActivity } from '../../hooks/useOrderVisitorActivity.js';
import { formatDuration } from '../../lib/engagementAnalytics.js';

/**
 * PART 19 — optional, compact visitor-engagement panel for the admin
 * enquiry/chat view. Renders nothing (not even a "no data" message) when
 * this enquiry predates `orders.analytics_visitor_id`, so it never
 * clutters the messaging interface for older enquiries — per the brief,
 * this stays optional and out of the way.
 */
function VisitorActivityPanel({ order }) {
  const { summary, status } = useOrderVisitorActivity(order.analytics_visitor_id);

  if (status === 'unavailable' || status === 'error') return null;
  if (status === 'loading') {
    return (
      <div className="rounded-DEFAULT border border-border bg-background-raised px-3 py-2 text-xs text-foreground-subtle">
        Loading visitor activity…
      </div>
    );
  }
  if (!summary) return null;

  return (
    <div className="rounded-DEFAULT border border-border bg-background-raised p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
        <Activity className="h-3.5 w-3.5" /> Visitor Activity
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
        <div>
          <p className="text-foreground-subtle">Active Time</p>
          <p className="font-medium text-foreground">{formatDuration(summary.activeSeconds)}</p>
        </div>
        <div>
          <p className="text-foreground-subtle">Sessions</p>
          <p className="font-medium text-foreground">{summary.sessions}</p>
        </div>
        <div>
          <p className="text-foreground-subtle">Pages</p>
          <p className="font-medium text-foreground">{summary.pages}</p>
        </div>
        <div>
          <p className="text-foreground-subtle">Source</p>
          <p className="font-medium text-foreground">{summary.source || 'Direct'}</p>
        </div>
        <div>
          <p className="text-foreground-subtle">Device</p>
          <p className="font-medium text-foreground">{summary.device || '—'}</p>
        </div>
        <div>
          <p className="text-foreground-subtle">Browser</p>
          <p className="font-medium text-foreground">{summary.browser || '—'}</p>
        </div>
        <div>
          <p className="text-foreground-subtle">Country</p>
          <p className="font-medium text-foreground">{summary.country || '—'}</p>
        </div>
        <div>
          <p className="text-foreground-subtle">City</p>
          <p className="font-medium text-foreground">{summary.city || '—'}</p>
        </div>
      </div>
      <Link
        to={`/admin/visitors/${order.analytics_visitor_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
      >
        View Full Visitor Analytics →
      </Link>
    </div>
  );
}

/**
 * Merges messages into the current thread by real message `id`,
 * re-sorted by created_at. Used for both the initial fetch and realtime
 * inserts so it doesn't matter which arrives first — a message that's
 * already present (same id) is never duplicated, and one that arrived
 * early via realtime survives the initial fetch "overwriting" it.
 */
function mergeMessages(current, incoming) {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
}

/**
 * `order` is a row from the `orders` table (id, client_name,
 * client_email, project_title, message, created_at, admin_read,
 * access_token). There is no price/category/status column on orders —
 * those only exist on `projects`, and orders has no project_id foreign
 * key to reliably join against, so only project_title (the real column)
 * is shown here, exactly like the vanilla admin panel.
 *
 * `onRequestDelete` is handled by the parent (AdminOrders) rather than
 * showing a confirmation dialog from inside this modal — avoids stacking
 * two Modal portals; the parent closes this one and opens ConfirmDialog
 * instead.
 */
export function AdminOrderDetails({ isOpen, onClose, order, onOrderChanged, onToast, onRequestDelete }) {
  const [thread, setThread] = useState([]);
  const [threadStatus, setThreadStatus] = useState('loading');
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('idle');
  const [isTogglingRead, setIsTogglingRead] = useState(false);

  const loadThread = useCallback(async () => {
    if (!order) return;
    setThreadStatus('loading');
    try {
      const data = await fetchOrderMessages(order.id);
      setThread((current) => mergeMessages(current, data));
      setThreadStatus('success');
    } catch (err) {
      setThreadStatus('error');
      // eslint-disable-next-line no-console
      console.error('Failed to load thread:', err);
    }
  }, [order]);

  useEffect(() => {
    if (isOpen && order) {
      setThread([]); // clear the previous enquiry's messages before loading the new one
      setReplyText('');
      setReplyStatus('idle');
      loadThread();
    }
    // Deliberately depends on order?.id, not `order` itself — the parent
    // creates a new order object reference on every refetch() (e.g.
    // after mark read/unread), and re-running this for the *same*
    // enquiry would wipe an in-progress typed reply for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, order?.id]);

  // Realtime: live-append new customer/admin messages for the
  // currently-open enquiry only. Separate effect, same dependencies as
  // the thread-load effect above — cleanup (removeChannel) runs
  // automatically whenever isOpen/order?.id changes or this unmounts,
  // so there is never more than one active subscription at a time.
  useEffect(() => {
    if (!isOpen || !order?.id) return undefined;

    const unsubscribe = subscribeToOrderMessages(order.id, (newMessage) => {
      setThread((current) => mergeMessages(current, [newMessage]));
    });

    return unsubscribe;
  }, [isOpen, order?.id]);

  // Polling fallback, supplementing the Realtime subscription above.
  // I can't verify from the frontend whether Realtime is actually
  // enabled for the `messages` table on the live Supabase project
  // (Database → Replication is a dashboard setting, invisible to this
  // code) — if it isn't, the subscription above silently receives
  // nothing, forever. Polling every few seconds guarantees new messages
  // still appear regardless, using the same query already proven to
  // work since Phase 6. Same id-based merge, so whichever path
  // (Realtime or poll) delivers a message first, it's never duplicated.
  useEffect(() => {
    if (!isOpen || !order?.id) return undefined;
    const interval = setInterval(() => {
      fetchOrderMessages(order.id)
        .then((data) => setThread((current) => mergeMessages(current, data)))
        .catch((err) => {
          // Silent — a real failure already surfaces via loadThread()'s
          // own error state; no need to disrupt the view every few
          // seconds for a background poll.
          // eslint-disable-next-line no-console
          console.error('Background thread poll failed:', err);
        });
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, order?.id]);

  if (!order) return null;

  async function handleSendReply(event) {
    event.preventDefault();
    const message = replyText.trim();
    if (!message || replyStatus === 'sending') return;

    setReplyStatus('sending');
    try {
      await sendAdminReply(order.id, message);
      setReplyText('');
      setReplyStatus('idle');
      await loadThread();
      onToast?.({ type: 'success', message: 'Reply sent — the client will see it in "My Messages".' });
    } catch (err) {
      setReplyStatus('idle');
      onToast?.({ type: 'error', message: `Could not send reply: ${err.message || 'please try again.'}` });
      // eslint-disable-next-line no-console
      console.error('sendAdminReply failed:', err);
    }
  }

  async function handleToggleRead() {
    setIsTogglingRead(true);
    try {
      if (order.admin_read === false) {
        await markOrderRead(order.id);
        onToast?.({ type: 'success', message: 'Marked as read.' });
      } else {
        await markOrderUnread(order.id);
        onToast?.({ type: 'success', message: 'Marked as unread.' });
      }
      onOrderChanged();
    } catch (err) {
      onToast?.({ type: 'error', message: `Could not update read status: ${err.message || 'please try again.'}` });
      // eslint-disable-next-line no-console
      console.error('Toggle read failed:', err);
    } finally {
      setIsTogglingRead(false);
    }
  }

  const isUnread = order.admin_read === false;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={order.project_title || 'General Inquiry'} className="max-w-lg">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Customer</p>
            <p className="mt-1 text-sm text-foreground">{order.client_name || 'Unknown'}</p>
            {order.client_email && (
              <a href={`mailto:${order.client_email}`} className="mt-0.5 flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground">
                <Mail className="h-3 w-3" /> {order.client_email}
              </a>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Submitted</p>
            <p className="mt-1 text-sm text-foreground">
              {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
            </p>
            {order.access_token && (
              <a
                href={`/track?track=${encodeURIComponent(order.access_token)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
              >
                View on tracking page <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {order.message && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">
              Original message
            </p>
            <p className="mt-1 text-sm text-foreground-muted">{order.message}</p>
          </div>
        )}

        {order.analytics_visitor_id && <VisitorActivityPanel order={order} />}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={handleToggleRead} isLoading={isTogglingRead}>
            {isUnread ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {isUnread ? 'Mark as read' : 'Mark as unread'}
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={() => onRequestDelete?.(order)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete Enquiry
          </Button>
        </div>

        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
            Conversation
          </p>

          {threadStatus === 'loading' && <Loading label="Loading conversation…" />}

          {threadStatus === 'error' && (
            <p className="text-sm text-foreground-subtle">
              Could not load replies. Try closing and reopening this enquiry.
            </p>
          )}

          {threadStatus === 'success' && thread.length === 0 && (
            <p className="text-sm text-foreground-subtle">No replies yet.</p>
          )}

          {threadStatus === 'success' && thread.length > 0 && (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {thread.map((m) => (
                <div
                  key={m.id ?? `${m.order_id}-${m.created_at}`}
                  className={`max-w-[85%] rounded-DEFAULT border px-3 py-2 text-sm ${
                    m.sender === 'admin'
                      ? 'ml-auto border-transparent bg-accent-muted text-foreground'
                      : 'border-border bg-background-raised'
                  }`}
                >
                  <p className="mb-0.5 text-xs font-medium text-foreground-subtle">
                    {m.sender === 'admin' ? 'You' : 'Client'}
                  </p>
                  <p>{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSendReply} className="flex items-end gap-2">
          <textarea
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${order.client_name || 'this client'}…`}
            className="flex-1 rounded-DEFAULT border border-border bg-background-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none"
          />
          <Button type="submit" isLoading={replyStatus === 'sending'} aria-label="Send reply">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Modal>
  );
}
