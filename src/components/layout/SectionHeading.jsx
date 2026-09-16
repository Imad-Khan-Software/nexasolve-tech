import { cn } from '../../lib/cn.js';

export function SectionHeading({ eyebrow, title, description, align = 'left', className }) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent">{eyebrow}</p>}
      <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 text-foreground-muted">{description}</p>}
    </div>
  );
}
