import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { cn } from '../../lib/cn.js';

export function ErrorState({
  title = 'Something went wrong',
  message = 'That didn\u2019t load. Check your connection and try again.',
  onRetry,
  retryLabel = 'Try again',
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-DEFAULT border border-border bg-background-surface px-6 py-10 text-center',
        className
      )}
    >
      <AlertTriangle className="h-6 w-6 text-danger" aria-hidden="true" />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-foreground-muted">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
