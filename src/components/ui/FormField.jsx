import { cn } from '../../lib/cn.js';

/**
 * Label + input/textarea + inline error message, shared by the enquiry
 * form and the tracking token input so validation styling is consistent
 * in exactly one place.
 */
export function FormField({
  id,
  label,
  error,
  as: Tag = 'input',
  className,
  endAdornment,
  ...props
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Tag
          id={id}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'w-full rounded-DEFAULT border bg-background-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none',
            endAdornment && 'pr-10',
            error ? 'border-danger focus:border-danger' : 'border-border focus:border-accent',
            className
          )}
          {...props}
        />
        {endAdornment && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{endAdornment}</div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
