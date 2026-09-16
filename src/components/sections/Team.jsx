import { Phone, Mail, MessageCircle, Facebook, Linkedin, Instagram, Globe, User } from 'lucide-react';
import { Container } from '../layout/Container.jsx';
import { SectionHeading } from '../layout/SectionHeading.jsx';
import { useVisibleTeamMembers } from '../../hooks/useVisibleTeamMembers.js';

function ContactLink({ href, icon: Icon, label }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

function TeamMemberCard({ member }) {
  const whatsappHref = member.whatsapp
    ? `https://wa.me/${member.whatsapp.replace(/[^\d]/g, '')}`
    : null;

  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-background-surface p-6 text-center shadow-subtle">
      <div className="h-24 w-24 overflow-hidden rounded-full border border-border bg-background-raised">
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-foreground-subtle">
            <User className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
      </div>

      <h3 className="mt-4 font-display text-base font-semibold text-foreground">{member.name}</h3>
      <p className="text-sm text-accent">{member.designation}</p>

      {member.bio && <p className="mt-3 text-sm text-foreground-muted">{member.bio}</p>}

      {(member.phone || member.email || member.whatsapp) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-foreground-muted">
          {member.phone && (
            <a href={`tel:${member.phone}`} className="flex items-center gap-1 hover:text-foreground">
              <Phone className="h-3 w-3" aria-hidden="true" /> {member.phone}
            </a>
          )}
          {member.email && (
            <a href={`mailto:${member.email}`} className="flex items-center gap-1 hover:text-foreground">
              <Mail className="h-3 w-3" aria-hidden="true" /> {member.email}
            </a>
          )}
        </div>
      )}

      {(whatsappHref || member.facebook_url || member.linkedin_url || member.instagram_url || member.website_url) && (
        <div className="mt-4 flex items-center gap-2">
          <ContactLink href={whatsappHref} icon={MessageCircle} label="WhatsApp" />
          <ContactLink href={member.facebook_url} icon={Facebook} label="Facebook" />
          <ContactLink href={member.linkedin_url} icon={Linkedin} label="LinkedIn" />
          <ContactLink href={member.instagram_url} icon={Instagram} label="Instagram" />
          <ContactLink href={member.website_url} icon={Globe} label="Website" />
        </div>
      )}
    </div>
  );
}

export function Team() {
  const { members, status } = useVisibleTeamMembers();

  // Nothing to show yet, still loading, or the fetch failed — in every
  // one of those cases the section is simply absent, per spec: no empty
  // section, no "coming soon", no error state shown on the public site
  // for what is, to a visitor, just an empty/optional section.
  if (status !== 'success' || members.length === 0) return null;

  return (
    <section id="team" className="scroll-mt-16 border-t border-border py-20">
      <Container>
        <SectionHeading eyebrow="Team" title="Our Leadership" align="center" className="mx-auto" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      </Container>
    </section>
  );
}
