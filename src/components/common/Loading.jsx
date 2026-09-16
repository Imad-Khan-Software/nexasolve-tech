import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function Loading({ label = 'Loading…', fullscreen = false, className }) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-foreground-muted',
        fullscreen ? 'min-h-[60vh]' : 'py-10',
        className
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
