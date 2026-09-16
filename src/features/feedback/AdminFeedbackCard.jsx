import { Star, Check, X, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';

const STATUS_STYLES = {
  pending: 'border-border text-foreground-muted',
  approved: 'border-success/40 text-success bg-success/10',
  rejected: 'border-danger/40 text-danger bg-danger/10',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
      {status}
    </span>
  );
}

export function AdminFeedbackCard({ item, onApprove, onReject, onEdit, onDelete }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background-surface p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
          <StatusBadge status={item.status} />
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={n <= item.rating ? 'h-3.5 w-3.5 fill-accent text-accent' : 'h-3.5 w-3.5 text-border-strong'}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
        {item.email && <p className="mt-0.5 text-xs text-foreground-subtle">{item.email}</p>}
        <p className="mt-2 text-sm text-foreground-muted">{item.message}</p>
        <p className="mt-2 text-xs text-foreground-subtle">
          Submitted {new Date(item.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
        {item.status !== 'approved' && (
          <Button type="button" variant="secondary" size="sm" onClick={() => onApprove(item)}>
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
        )}
        {item.status !== 'rejected' && (
          <Button type="button" variant="secondary" size="sm" onClick={() => onReject(item)}>
            <X className="h-3.5 w-3.5" /> Reject
          </Button>
        )}
        <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(item)}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
        <Button type="button" variant="danger" size="sm" onClick={() => onDelete(item)}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}
