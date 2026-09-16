import { Globe, Atom, LayoutTemplate, Wrench, Puzzle } from 'lucide-react';
import { Container } from '../layout/Container.jsx';
import { SectionHeading } from '../layout/SectionHeading.jsx';

const SERVICES = [
  { icon: Globe, title: 'Web Development', description: 'Modern responsive websites and web applications.' },
  { icon: Atom, title: 'React Development', description: 'Interactive frontend applications using React.' },
  { icon: LayoutTemplate, title: 'UI Development', description: 'Clean and responsive interfaces from designs or requirements.' },
  { icon: Wrench, title: 'Website Fixes', description: 'HTML, CSS and JavaScript bug fixing and improvements.' },
  { icon: Puzzle, title: 'Custom Web Solutions', description: 'Custom web solutions for businesses and individuals.' },
];

export function Services() {
  return (
    <section id="services" className="scroll-mt-16 py-20">
      <Container>
        <SectionHeading eyebrow="Services" title="What I can build for you" align="center" className="mx-auto" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-lg border border-border bg-background-surface p-6 shadow-subtle transition-colors hover:border-border-strong">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-DEFAULT bg-accent-muted text-accent">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-foreground-muted">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
