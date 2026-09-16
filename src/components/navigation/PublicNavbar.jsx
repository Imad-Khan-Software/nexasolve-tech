import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Container } from '../layout/Container.jsx';
import { Button } from '../ui/Button.jsx';
import { SITE_CONFIG } from '../../lib/siteConfig.js';

const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#services', label: 'Services' },
  { href: '#projects', label: 'Projects' },
  { href: '#team', label: 'Team' },
  { href: '#feedback', label: 'Feedback' },
  { href: '#contact', label: 'Contact' },
];

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <a href="#home" className="font-display text-lg font-semibold text-foreground">
          {SITE_CONFIG.brand.split(' ')[0]}{' '}
          <span className="text-accent">{SITE_CONFIG.brand.split(' ').slice(1).join(' ')}</span>
        </a>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button as="a" href="#contact" size="sm">
            Let&rsquo;s Work Together
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-DEFAULT p-2 text-foreground md:hidden"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          aria-controls="mobile-nav-panel"
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {isOpen && (
        <div id="mobile-nav-panel" className="border-t border-border bg-background md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-DEFAULT px-3 py-2.5 text-sm text-foreground-muted hover:bg-background-raised hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <Button as="a" href="#contact" onClick={() => setIsOpen(false)} className="mt-2">
              Let&rsquo;s Work Together
            </Button>
          </Container>
        </div>
      )}
    </header>
  );
}
