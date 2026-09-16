import { Code2, Palette, Braces, Atom, Wind, Database, GitBranch, Github, Smartphone } from 'lucide-react';
import { Container } from '../layout/Container.jsx';
import { SectionHeading } from '../layout/SectionHeading.jsx';

const SKILLS = [
  { label: 'HTML', icon: Code2 },
  { label: 'CSS', icon: Palette },
  { label: 'JavaScript', icon: Braces },
  { label: 'React', icon: Atom },
  { label: 'Tailwind CSS', icon: Wind },
  { label: 'Supabase', icon: Database },
  { label: 'Git', icon: GitBranch },
  { label: 'GitHub', icon: Github },
  { label: 'Responsive Web Design', icon: Smartphone },
];

export function Skills() {
  return (
    <section id="skills" className="scroll-mt-16 border-t border-border py-20">
      <Container>
        <SectionHeading eyebrow="Skills" title="Technologies I work with" align="center" className="mx-auto" />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {SKILLS.map(({ label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-3 rounded-DEFAULT border border-border bg-background-surface px-4 py-6 text-center transition-colors hover:border-border-strong">
              <Icon className="h-6 w-6 text-accent" aria-hidden="true" />
              <span className="text-sm text-foreground-muted">{label}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
