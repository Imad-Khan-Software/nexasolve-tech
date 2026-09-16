import { Github, Linkedin, Facebook, Instagram, Mail } from 'lucide-react';
import { Container } from './Container.jsx';
import { SITE_CONFIG, resolveContactLinks } from '../../lib/siteConfig.js';

const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#services', label: 'Services' },
  { href: '#projects', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
];

const SOCIAL_ICONS = { github: Github, linkedin: Linkedin, facebook: Facebook, instagram: Instagram };

export function Footer({ profile }) {
  const links = resolveContactLinks(profile);
  const tagline = profile?.tagline || SITE_CONFIG.defaultTagline;
  const location = profile?.location || SITE_CONFIG.defaultLocation;
  const socialEntries = Object.entries(SOCIAL_ICONS).filter(([key]) => links[key]);

  return (
    <footer className="border-t border-border">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="font-display text-lg font-semibold text-foreground">{SITE_CONFIG.brand}</p>
          <p className="mt-3 max-w-sm text-sm text-foreground-muted">{tagline}</p>
          <p className="mt-3 text-sm text-foreground-subtle">{location}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">Navigate</p>
          <ul className="mt-3 space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-sm text-foreground-muted hover:text-foreground">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">Connect</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${links.email}${links.emailCc ? `?cc=${links.emailCc}` : ''}`}
              aria-label="Email"
              className="rounded-DEFAULT border border-border p-2 text-foreground-muted hover:border-border-strong hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
            </a>
            {socialEntries.map(([key, Icon]) => (
              <a
                key={key}
                href={links[key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={key}
                className="rounded-DEFAULT border border-border p-2 text-foreground-muted hover:border-border-strong hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </Container>

      <div className="border-t border-border py-6">
        <Container className="text-sm text-foreground-subtle">
          © {new Date().getFullYear()} {SITE_CONFIG.brand}. All rights reserved.
        </Container>
      </div>
    </footer>
  );
}
