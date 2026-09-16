import { Container } from '../layout/Container.jsx';
import { SectionHeading } from '../layout/SectionHeading.jsx';
import { SITE_CONFIG } from '../../lib/siteConfig.js';

export function About({ profile }) {
  const bio = profile?.tagline || SITE_CONFIG.defaultTagline;
  const location = profile?.location || SITE_CONFIG.defaultLocation;

  return (
    <section id="about" className="scroll-mt-16 py-20">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <SectionHeading eyebrow="About" title="A frontend developer who ships." />
        <div className="space-y-4 text-foreground-muted">
          <p>{bio}</p>
          <p>
            Based in {location}, currently focused on building clean, responsive
            interfaces with React and Supabase-backed applications — with an eye for
            the small details that separate a working site from a polished one.
          </p>
        </div>
      </Container>
    </section>
  );
}
