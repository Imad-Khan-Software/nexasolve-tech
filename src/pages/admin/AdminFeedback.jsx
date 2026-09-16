import { useMemo, useState } from 'react';
import { Search, MessageSquareQuote } from 'lucide-react';
import { Loading } from '../../components/common/Loading.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { Toast } from '../../components/ui/Toast.jsx';
import { cn } from '../../lib/cn.js';
import { useAdminFeedback } from '../../hooks/useAdminFeedback.js';
import { updateFeedbackStatus, deleteFeedback as deleteFeedbackRequest } from '../../services/feedbackService.js';
import { AdminFeedbackCard } from '../../features/feedback/AdminFeedbackCard.jsx';
import { AdminFeedbackEditForm } from '../../features/feedback/AdminFeedbackEditForm.jsx';

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-background-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p>
      <p className="mt-2 font-display text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function AdminFeedback() {
  const { feedback, status, error, refetch } = useAdminFeedback();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState(null);

  const [editState, setEditState] = useState({ open: false, item: null });
  const [deleteState, setDeleteState] = useState({ open: false, item: null, isDeleting: false });
  const [toast, setToast] = useState(null);

  const stats = useMemo(() => {
    const total = feedback.length;
    const pending = feedback.filter((f) => f.status === 'pending').length;
    const approved = feedback.filter((f) => f.status === 'approved').length;
    const rejected = feedback.filter((f) => f.status === 'rejected').length;
    const average = total > 0 ? (feedback.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1) : '—';
    return { total, pending, approved, rejected, average };
  }, [feedback]);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return feedback.filter((item) => {
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter.toLowerCase();
      if (!matchesStatus) return false;
      const matchesRating = !ratingFilter || item.rating === ratingFilter;
      if (!matchesRating) return false;
      if (!query) return true;
      const haystack = [item.name, item.email, item.message].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [feedback, searchTerm, statusFilter, ratingFilter]);

  async function handleModerate(item, nextStatus) {
    try {
      await updateFeedbackStatus(item.id, nextStatus);
      refetch();
      setToast({ type: 'success', message: `Feedback ${nextStatus}.` });
    } catch (err) {
      setToast({ type: 'error', message: 'Could not update this feedback. Please try again.' });
      // eslint-disable-next-line no-console
      console.error('Feedback moderation failed:', err);
    }
  }

  function openEdit(item) {
    setEditState({ open: true, item });
  }
  function closeEdit() {
    setEditState({ open: false, item: null });
  }
  function handleSaved() {
    closeEdit();
    refetch();
    setToast({ type: 'success', message: 'Feedback updated successfully.' });
  }

  function openDeleteConfirm(item) {
    setDeleteState({ open: true, item, isDeleting: false });
  }
  function closeDeleteConfirm() {
    if (deleteState.isDeleting) return;
    setDeleteState({ open: false, item: null, isDeleting: false });
  }
  async function handleConfirmDelete() {
    if (!deleteState.item) return;
    setDeleteState((s) => ({ ...s, isDeleting: true }));
    try {
      await deleteFeedbackRequest(deleteState.item.id);
      setDeleteState({ open: false, item: null, isDeleting: false });
      refetch();
      setToast({ type: 'success', message: 'Feedback deleted successfully.' });
    } catch (err) {
      setDeleteState((s) => ({ ...s, isDeleting: false }));
      setToast({ type: 'error', message: 'Could not delete this feedback. Please try again.' });
      // eslint-disable-next-line no-console
      console.error('Feedback delete failed:', err);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Feedback</h1>
        <p className="mt-1 text-sm text-foreground-muted">Review and moderate visitor testimonials.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Approved" value={stats.approved} />
        <StatCard label="Rejected" value={stats.rejected} />
        <StatCard label="Avg Rating" value={stats.average} />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" aria-hidden="true" />
          <label htmlFor="admin-feedback-search" className="sr-only">Search feedback</label>
          <input
            id="admin-feedback-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, email, message…"
            className="w-full rounded-DEFAULT border border-border bg-background-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              aria-pressed={statusFilter === s}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === s ? 'border-transparent bg-accent text-background' : 'border-border text-foreground-muted hover:border-border-strong hover:text-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by rating">
          {[null, 5, 4, 3, 2, 1].map((r) => (
            <button
              key={r ?? 'all'}
              type="button"
              onClick={() => setRatingFilter(r)}
              aria-pressed={ratingFilter === r}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                ratingFilter === r ? 'border-transparent bg-accent text-background' : 'border-border text-foreground-muted hover:border-border-strong hover:text-foreground'
              )}
            >
              {r ? `${r}★` : 'All ratings'}
            </button>
          ))}
        </div>
      </div>

      {status === 'loading' && <Loading label="Loading feedback…" />}

      {status === 'error' && (
        <ErrorState title="Couldn't load feedback" message={error?.message || 'Something went wrong.'} onRetry={refetch} />
      )}

      {status === 'success' && feedback.length === 0 && (
        <EmptyState icon={MessageSquareQuote} title="No feedback yet" description="Visitor submissions from the public site will show up here." />
      )}

      {status === 'success' && feedback.length > 0 && filtered.length === 0 && (
        <EmptyState icon={MessageSquareQuote} title="No feedback found" description="Try a different search term or filter." />
      )}

      {status === 'success' && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((item) => (
            <AdminFeedbackCard
              key={item.id}
              item={item}
              onApprove={(i) => handleModerate(i, 'approved')}
              onReject={(i) => handleModerate(i, 'rejected')}
              onEdit={openEdit}
              onDelete={openDeleteConfirm}
            />
          ))}
        </div>
      )}

      <AdminFeedbackEditForm isOpen={editState.open} item={editState.item} onClose={closeEdit} onSaved={handleSaved} />

      <ConfirmDialog
        isOpen={deleteState.open}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        isLoading={deleteState.isDeleting}
        title="Delete Feedback?"
        message={deleteState.item ? `Are you sure you want to delete this feedback from "${deleteState.item.name}"? This action cannot be undone.` : ''}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
