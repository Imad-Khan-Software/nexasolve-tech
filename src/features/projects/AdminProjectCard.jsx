import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { parseTechs } from '../../lib/siteConfig.js';

export function AdminProjectCard({ project, onEdit, onDelete }) {
  const techs = parseTechs(project.techs);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-background-surface p-4 sm:flex-row">
      <div className="aspect-video w-full shrink-0 overflow-hidden rounded-DEFAULT border border-border bg-background-raised sm:w-40">
        {project.image_url ? (
          <img src={project.image_url} alt={project.title} className="h-full w-full object-contain" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-foreground-subtle">No image</div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{project.title}</h3>
              {project.category && <Badge variant="accent">{project.category}</Badge>}
            </div>
            {project.description && (
              <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">{project.description}</p>
            )}
          </div>
          {project.price && <span className="shrink-0 text-sm font-medium text-accent">{project.price}</span>}
        </div>

        {techs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {techs.map((tech) => (
              <Badge key={tech}>{tech}</Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          {project.demo_url && (
            <Button as="a" href={project.demo_url} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
              View Demo <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(project)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={() => onDelete(project)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
