import { ExternalLink } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { parseTechs } from '../../lib/siteConfig.js';
import { useTrackVisit } from '../../hooks/useTrackVisit.js';

/**
 * onEnquire is called with the full project object when the customer
 * clicks "Enquire" — the parent (ProjectsSection) owns the single shared
 * EnquiryModal instance, so this component never manages that state
 * itself (one modal in the DOM, not one per card).
 *
 * Visit tracking fires on "View Demo" and "Enquire" clicks specifically
 * — this app has no dedicated per-project route/page to attach a
 * mount-based "page opened" event to (every project lives on the single
 * homepage grid), so a deliberate click is the closest honest signal of
 * "this visitor is genuinely interested in this service," and it can
 * never fire merely from a re-render.
 */
export function ProjectCard({ project, onEnquire }) {
  const techs = parseTechs(project.techs);
  const trackVisit = useTrackVisit();

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-background-surface shadow-subtle transition-colors hover:border-border-strong">
      <div className="aspect-video w-full overflow-hidden bg-background-raised">
        {project.image_url ? (
          <img src={project.image_url} alt={project.title} className="h-full w-full object-contain" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-foreground-subtle">No image</div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {project.category && <Badge variant="accent" className="mb-3 w-fit">{project.category}</Badge>}

        <h3 className="text-base font-semibold text-foreground">{project.title}</h3>

        {project.description && (
          <p className="mt-2 line-clamp-3 text-sm text-foreground-muted">{project.description}</p>
        )}

        {techs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {techs.map((tech) => <Badge key={tech}>{tech}</Badge>)}
          </div>
        )}

        {project.price && <p className="mt-3 text-sm font-medium text-accent">{project.price}</p>}

        <div className="mt-auto flex items-center gap-2 pt-5">
          {project.demo_url && (
            <Button
              as="a"
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => trackVisit(project.title)}
            >
              Live Demo <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="flex-1"
            onClick={() => {
              trackVisit(project.title);
              onEnquire(project);
            }}
          >
            Enquire
          </Button>
        </div>
      </div>
    </article>
  );
}
