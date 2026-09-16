import { Github, Linkedin } from 'lucide-react';
import { Container } from '../layout/Container.jsx';
import { Button } from '../ui/Button.jsx';
import { SITE_CONFIG, resolveContactLinks } from '../../lib/siteConfig.js';

export function Hero({ profile }) {
  const name = profile?.name || SITE_CONFIG.defaultName;
  const avatarUrl = profile?.avatar_url;
  const links = resolveContactLinks(profile);

  return (
    <section id="home" className="scroll-mt-16 py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-4 font-mono text-sm text-accent">Hi, I&rsquo;m {name} 👋</p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Building Modern Web Experiences That Solve Real Problems
          </h1>
          <p className="mt-6 max-w-xl text-lg text-foreground-muted">
            {SITE_CONFIG.brand} designs and builds responsive websites, interactive web
            applications, and custom frontend solutions — from a first prototype to a
            production-ready product.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button as="a" href="#projects" size="lg">View Projects</Button>
            <Button as="a" href="#contact" variant="secondary" size="lg">Let&rsquo;s Work Together</Button>
          </div>
          {(links.github || links.linkedin) && (
            <div className="mt-8 flex items-center gap-3">
              {links.github && (
                <a href={links.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub"
                  className="rounded-DEFAULT border border-border p-2 text-foreground-muted hover:border-border-strong hover:text-foreground">
                  <Github className="h-4 w-4" />
                </a>
              )}
              {links.linkedin && (
                <a href={links.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                  className="rounded-DEFAULT border border-border p-2 text-foreground-muted hover:border-border-strong hover:text-foreground">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-sm">
          <div className="absolute inset-0 rounded-lg bg-accent-muted blur-2xl" aria-hidden="true" />
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-background-surface shadow-card">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${name} — profile photo`} className="h-full w-full object-contain" />
            ) : (
              <pre className="whitespace-pre-wrap px-6 font-mono text-xs leading-relaxed text-foreground-subtle">
{`const build = (idea) => {
  const plan = design(idea);
  const site = develop(plan);
  return ship(site);
};`}
              </pre>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
