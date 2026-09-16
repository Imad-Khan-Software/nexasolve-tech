import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Send, PackageSearch } from 'lucide-react';
import { Container } from '../../components/layout/Container.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Loading } from '../../components/common/Loading.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { fetchOrderThread, sendClientMessage } from '../../services/orderService.js';
import { getStoredTokens, saveTrackingToken } from '../../lib/trackingTokens.js';

const POLL_INTERVAL_MS = 4000;

/**
 * Merges message rows by real `id` (never array index), re-sorted by
 * created_at. Same pattern used on the admin side — whichever fetch/poll
 * arrives, a message already present is never duplicated.
 */
function mergeMessages(current, incoming) {
  const keyOf = (m) => m.id ?? `${m.sender}-${m.created_at}-${m.message}`;
  const byKey = new Map(current.map((m) => [keyOf(m), m]));
  for (const m of incoming) byKey.set(keyOf(m), m);
  return Array.from(byKey.values()).sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
}

/**
 * Reads a thread via the existing get_order_thread(p_token) RPC — never
 * a direct `orders`/`messages` query — so a visitor can only ever see
 * the single thread their token unlocks. Shape consumed matches the
 * vanilla app exactly: data[0] carries order-level fields (project_title,
 * created_at, client_message); rows with a non-null `sender` are the
 * message thread. No `status` field exists in that shape.
 *
 * "Continuous conversation" here is deliberately implemented as polling
 * this same secure RPC on a timer, not a Postgres Realtime subscription
 * — Realtime subscriptions are authorized against table-level RLS, not
 * through an RPC's internal token check, so there's no safe way to scope
 * a Realtime subscription to just this token's messages without
 * exposing the table more broadly. Polling the RPC has none of that
 * risk: it's the exact same token-gated call already in use, just
 * repeated.
 */
export function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlToken = searchParams.get('track');

  const [tokenInput, setTokenInput] = useState(urlToken || '');
  const [activeToken, setActiveToken] = useState(null);
  const [lookupStatus, setLookupStatus] = useState('idle'); // idle | loading | success | empty | error
  const [lookupError, setLookupError] = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const [messages, setMessages] = useState([]);

  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('idle'); // idle | sending | error
  const [replyError, setReplyError] = useState(null);

  const savedTokens = getStoredTokens();

  async function runLookup(token) {
    const trimmed = token.trim();
    if (!trimmed) return;

    setActiveToken(trimmed);
    setLookupStatus('loading');
    setLookupError(null);
    setReplyText('');
    setReplyStatus('idle');
    setMessages([]); // clear the previous token's messages before loading the new one

    try {
      const data = await fetchOrderThread(trimmed);
      if (!data || data.length === 0) {
        setLookupStatus('empty');
        setOrderInfo(null);
        return;
      }
      setOrderInfo(data[0] || null);
      setMessages(data.filter((row) => row.sender));
      setLookupStatus('success');
      saveTrackingToken(trimmed, data[0]?.project_title);
    } catch (err) {
      setLookupError(err);
      setLookupStatus('error');
      // eslint-disable-next-line no-console
      console.error('Order thread lookup failed:', err);
    }
  }

  // Silent background refresh — no loading spinner, no reset of
  // in-progress reply text. Used both by polling and right after a
  // successful reply send.
  const pollThread = useCallback(async (token) => {
    try {
      const data = await fetchOrderThread(token);
      if (!data || data.length === 0) return;
      setOrderInfo(data[0] || null);
      setMessages((current) => mergeMessages(current, data.filter((row) => row.sender)));
    } catch (err) {
      // Silent — this runs unattended every few seconds. A real error
      // will already have surfaced via the initial runLookup(), so
      // there's no need to flash an error state for a background poll.
      // eslint-disable-next-line no-console
      console.error('Background thread poll failed:', err);
    }
  }, []);

  // Auto-run a lookup if the page was opened with ?track=CODE — the same
  // query param name the vanilla app already uses.
  useEffect(() => {
    if (urlToken) runLookup(urlToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlToken]);

  // Poll for new messages (e.g. an admin reply, or the customer's own
  // message sent from another tab/device) while a thread is displayed.
  useEffect(() => {
    if (lookupStatus !== 'success' || !activeToken) return undefined;
    const interval = setInterval(() => pollThread(activeToken), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [lookupStatus, activeToken, pollThread]);

  function handleSubmit(event) {
    event.preventDefault();
    if (lookupStatus === 'loading') return;
    setSearchParams(tokenInput.trim() ? { track: tokenInput.trim() } : {});
    runLookup(tokenInput);
  }

  function handleSavedTokenClick(token) {
    setTokenInput(token);
    setSearchParams({ track: token });
    runLookup(token);
  }

  async function handleReplySubmit(event) {
    event.preventDefault();
    const message = replyText.trim();
    if (!message || replyStatus === 'sending' || !activeToken) return;

    setReplyStatus('sending');
    setReplyError(null);
    try {
      await sendClientMessage(activeToken, message);
      setReplyText('');
      setReplyStatus('idle');
      await pollThread(activeToken);
    } catch (err) {
      setReplyError('Could not send your message. Please try again.');
      setReplyStatus('error');
      // eslint-disable-next-line no-console
      console.error('Reply failed:', err);
    }
  }

  return (
    <Container className="max-w-2xl py-16">
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          Track Your Enquiry
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Enter the tracking ID you received when you submitted an enquiry.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <FormField
            id="tracking-token"
            label="Tracking ID"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="e.g. 8f3a1c2b..."
            className="font-mono"
          />
        </div>
        <Button type="submit" isLoading={lookupStatus === 'loading'} className="sm:w-auto">
          <Search className="h-4 w-4" /> Track Enquiry
        </Button>
      </form>

      {savedTokens.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
            Saved on this device
          </p>
          <div className="flex flex-wrap gap-2">
            {savedTokens.map((entry) => (
              <button
                key={entry.token}
                type="button"
                onClick={() => handleSavedTokenClick(entry.token)}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground-muted hover:border-border-strong hover:text-foreground"
              >
                {entry.project_title || 'Enquiry'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        {lookupStatus === 'loading' && <Loading label="Looking up your enquiry…" />}

        {lookupStatus === 'error' && (
          <ErrorState
            title="Couldn't load your enquiry"
            message={lookupError?.message || 'Something went wrong. Please try again.'}
            onRetry={() => activeToken && runLookup(activeToken)}
          />
        )}

        {lookupStatus === 'empty' && (
          <EmptyState
            icon={PackageSearch}
            title="Enquiry not found"
            description="We couldn't find an enquiry with that tracking ID."
          />
        )}

        {lookupStatus === 'success' && orderInfo && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-background-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {orderInfo.project_title || 'General Inquiry'}
                </h2>
                {orderInfo.created_at && (
                  <span className="text-xs text-foreground-subtle">
                    Submitted {new Date(orderInfo.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              {orderInfo.client_message && (
                <p className="mt-3 text-sm text-foreground-muted">{orderInfo.client_message}</p>
              )}
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                Messages
              </p>
              {messages.length === 0 ? (
                <p className="text-sm text-foreground-subtle">No replies yet.</p>
              ) : (
                <div className="space-y-3">
                  {messages.map((row) => (
                    <div
                      key={row.id ?? `${row.sender}-${row.created_at}-${row.message}`}
                      className={`max-w-[85%] rounded-DEFAULT border px-4 py-2.5 text-sm ${
                        row.sender === 'admin'
                          ? 'border-border bg-background-raised'
                          : 'ml-auto border-transparent bg-accent-muted text-foreground'
                      }`}
                    >
                      <p className="mb-1 text-xs font-medium text-foreground-subtle">
                        {row.sender === 'admin' ? 'Developer' : 'You'}
                      </p>
                      <p>{row.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleReplySubmit} className="flex items-end gap-2">
              <div className="flex-1">
                <FormField
                  id="reply-message"
                  label="Send a follow-up"
                  as="textarea"
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  error={replyStatus === 'error' ? replyError : undefined}
                />
              </div>
              <Button type="submit" isLoading={replyStatus === 'sending'} aria-label="Send reply">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </Container>
  );
}
