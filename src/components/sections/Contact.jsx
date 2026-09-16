import { Mail, Phone, MapPin, Linkedin, Github, ExternalLink } from 'lucide-react';
import { Container } from '../layout/Container.jsx';
import { SectionHeading } from '../layout/SectionHeading.jsx';
import { Button } from '../ui/Button.jsx';
import { SITE_CONFIG, resolveContactLinks } from '../../lib/siteConfig.js';

export function Contact({ profile }) {
  const links = resolveContactLinks(profile);
  const location = profile?.location || SITE_CONFIG.defaultLocation;
  const hasPhone = Boolean(links.whatsapp);

  return (
    <section id="contact" className="scroll-mt-16 border-t border-border py-20">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <SectionHeading
            eyebrow="Contact"
            title="Let's work together"
            description="Have a project in mind, or just want to say hello? Reach out directly or start an enquiry from a project above."
          />
          <div className="mt-8 space-y-4">
            <a href={`mailto:${links.email}${links.emailCc ? `?cc=${links.emailCc}` : ''}`} className="flex items-center gap-3 text-sm text-foreground-muted hover:text-foreground">
              <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
              {links.email}
            </a>
            {hasPhone && (
              <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground-muted hover:text-foreground">
                <Phone className="h-4 w-4 text-accent" aria-hidden="true" />
                WhatsApp
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
            {location && (
              <p className="flex items-center gap-3 text-sm text-foreground-muted">
                <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
                {location}
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            {links.linkedin && (
              <Button as="a" href={links.linkedin} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
                <Linkedin className="h-4 w-4" /> LinkedIn
              </Button>
            )}
            {links.github && (
              <Button as="a" href={links.github} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
                <Github className="h-4 w-4" /> GitHub
              </Button>
            )}
            {links.fiverr && (
              <Button as="a" href={links.fiverr} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
                Fiverr <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background-surface p-8 shadow-subtle">
          <h3 className="font-display text-lg font-semibold text-foreground">Start a project</h3>
          <p className="mt-2 text-sm text-foreground-muted">
            The quickest way to reach me is a direct email — I read every message and
            reply within a day or two. Already sent an enquiry from a project?
          </p>
          <Button as="a" href={`mailto:${links.email}${links.emailCc ? `?cc=${links.emailCc}` : ''}`} className="mt-6 w-full" size="lg">
            <Mail className="h-4 w-4" /> Email Me
          </Button>
          <Button as="a" href="/track" variant="secondary" className="mt-3 w-full" size="lg">
            Track an Enquiry
          </Button>
        </div>
      </Container>
    </section>
  );
}
