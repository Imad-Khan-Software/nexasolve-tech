import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const VARIANT_CLASSES = {
  primary: 'bg-accent text-background hover:bg-accent-hover focus-visible:outline-accent',
  secondary: 'bg-background-raised text-foreground border border-border hover:border-border-strong',
  ghost: 'bg-transparent text-foreground-muted hover:text-foreground hover:bg-background-raised',
  danger: 'bg-danger text-foreground hover:bg-danger/90',
};

const SIZE_CLASSES = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export const Button = forwardRef(function Button(
  { children, variant = 'primary', size = 'md', isLoading = false, disabled = false, className, type = 'button', as: Tag, ...props },
  ref
) {
  const Comp = Tag || 'button';
  return (
    <Comp
      ref={ref}
      type={Tag ? undefined : type}
      disabled={Tag ? undefined : disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-DEFAULT font-medium',
        'transition-colors duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </Comp>
  );
});
