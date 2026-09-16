import { cn } from '../../lib/cn.js';

const VARIANT_CLASSES = {
  neutral: 'bg-background-raised text-foreground-muted border-border',
  accent: 'bg-accent-muted text-accent border-transparent',
};

export function Badge({ children, variant = 'neutral', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
