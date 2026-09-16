import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Inbox, UserCircle2, Mail } from 'lucide-react';
import { Loading } from '../../components/common/Loading.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { useProjects } from '../../hooks/useProjects.js';
import { useProfile } from '../../hooks/useProfile.js';
import { fetchOrdersCount, fetchRecentOrders } from '../../services/orderService.js';

function StatCard({ icon: Icon, label, value, isLoading, to }) {
  const Wrapper = to ? Link : 'div';
  return (
    <Wrapper
      to={to}
      className="rounded-lg border border-border bg-background-surface p-5 transition-colors hover:border-border-strong"
    >
      <div className="flex items-center gap-2 text-foreground-muted">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-foreground">
        {isLoading ? '—' : value}
      </p>
    </Wrapper>
  );
}

/**
 * No message-count card here: the vanilla app only ever reads `messages`
 * scoped to one order_id at a time (never a blanket count across every
 * order), so I don't have confirmation that an unscoped count is safe
 * under the existing RLS. Better to leave it out than guess — it can be
 * added once the messaging phase defines that access pattern properly.
 */
export function AdminHome() {
  const { projects, status: projectsStatus } = useProjects();
  const { profile, status: profileStatus } = useProfile();

  const [ordersCount, setOrdersCount] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersStatus, setOrdersStatus] = useState('loading');
  const [ordersError, setOrdersError] = useState(null);

  async function loadOrdersSummary() {
    setOrdersStatus('loading');
    setOrdersError(null);
    try {
      const [count, recent] = await Promise.all([fetchOrdersCount(), fetchRecentOrders(5)]);
      setOrdersCount(count);
      setRecentOrders(recent);
      setOrdersStatus('success');
    } catch (err) {
      setOrdersError(err);
      setOrdersStatus('error');
    }
  }

  useEffect(() => {
    loadOrdersSummary();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-foreground-muted">An overview of your portfolio.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={FolderKanban}
          label="Projects"
          value={projects.length}
          isLoading={projectsStatus === 'loading'}
          to="/admin/projects"
        />
        <StatCard
          icon={Inbox}
          label="Enquiries"
          value={ordersCount ?? 0}
          isLoading={ordersStatus === 'loading'}
          to="/admin/orders"
        />
        <StatCard
          icon={UserCircle2}
          label="Profile"
          value={profile?.name ? 'Set up' : 'Incomplete'}
          isLoading={profileStatus === 'loading'}
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-foreground">
            Recent enquiries
          </h2>
          <Link
            to="/admin/orders"
            className="rounded-full border border-border px-2.5 py-1 text-[10px] uppercase tracking-wide text-foreground-muted hover:border-border-strong hover:text-foreground"
          >
            View all
          </Link>
        </div>

        {ordersStatus === 'loading' && <Loading label="Loading enquiries…" />}

        {ordersStatus === 'error' && (
          <ErrorState
            title="Couldn't load enquiries"
            message={ordersError?.message || 'Something went wrong.'}
            onRetry={loadOrdersSummary}
          />
        )}

        {ordersStatus === 'success' && recentOrders.length === 0 && (
          <EmptyState
            icon={Mail}
            title="No enquiries yet"
            description='Messages from the "Enquire" form on your public site will show up here.'
          />
        )}

        {ordersStatus === 'success' && recentOrders.length > 0 && (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="rounded-lg border border-border bg-background-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {order.admin_read === false && (
                      <span
                        className="h-2 w-2 rounded-full bg-accent"
                        aria-label="Unread"
                        title="Unread"
                      />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {order.client_name || 'Unknown'}
                    </span>
                    <span className="text-xs text-foreground-subtle">
                      — {order.project_title || 'General Inquiry'}
                    </span>
                  </div>
                  {order.created_at && (
                    <span className="text-xs text-foreground-subtle">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {order.client_email && (
                  <p className="mt-1 text-xs text-foreground-subtle">{order.client_email}</p>
                )}
                {order.message && (
                  <p className="mt-2 line-clamp-2 text-sm text-foreground-muted">{order.message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
