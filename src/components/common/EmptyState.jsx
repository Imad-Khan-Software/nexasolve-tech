import { Inbox } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-DEFAULT border border-dashed border-border px-6 py-16 text-center',
        className
      )}
    >
      <Icon className="h-7 w-7 text-foreground-subtle" aria-hidden="true" />
      <div>
        <p className="font-display text-lg font-medium text-foreground">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-foreground-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
