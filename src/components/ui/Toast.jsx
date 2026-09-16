import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/cn.js';

/**
 * Controlled by the parent (pass `toast` state + `onDismiss`). Auto-
 * dismisses after 3.5s but can also be closed manually. Not a global
 * context/provider — kept page-scoped since only the admin project page
 * needs it today; can be lifted later if more pages need it.
 */
export function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      role="status"
      className={cn(
        'fixed bottom-4 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-2 rounded-DEFAULT border px-4 py-3 text-sm shadow-raised',
        isError
          ? 'border-danger/40 bg-background-raised text-danger'
          : 'border-success/40 bg-background-raised text-success'
      )}
    >
      {isError ? (
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span className="flex-1 text-foreground">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-sm p-0.5 text-foreground-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
