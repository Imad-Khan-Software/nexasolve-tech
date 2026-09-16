import { Search } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function ProjectFilters({ searchTerm, onSearchChange, categories, selectedCategory, onCategoryChange }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" aria-hidden="true" />
        <label htmlFor="project-search" className="sr-only">Search projects</label>
        <input
          id="project-search"
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search projects…"
          className="w-full rounded-DEFAULT border border-border bg-background-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none"
        />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {['All', ...categories].map((category) => {
            const isActive = category === 'All' ? selectedCategory === null : selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onCategoryChange(category === 'All' ? null : category)}
                aria-pressed={isActive}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive ? 'border-transparent bg-accent text-background' : 'border-border text-foreground-muted hover:border-border-strong hover:text-foreground'
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
