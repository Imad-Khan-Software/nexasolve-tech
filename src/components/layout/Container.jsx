import { cn } from '../../lib/cn.js';

export function Container({ children, className, as: Tag = 'div' }) {
  return (
    <Tag className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </Tag>
  );
}
