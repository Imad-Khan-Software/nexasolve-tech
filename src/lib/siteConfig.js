/**
 * Site-wide fallback values, used only when Supabase doesn't yet have the
 * corresponding field populated. These are the same real values already
 * live in the existing vanilla app (public.js) — not invented data.
 */
export const SITE_CONFIG = {
  brand: 'NexaSolve Tech',
  defaultName: 'Imad Khan',
  defaultTitle: 'Frontend Developer & Software Engineering Student',
  defaultTagline:
    'International digital product and web experience specialists. We create scalable, polished digital platforms for global businesses and growth-minded brands.',
  defaultLocation: 'Khyber Pakhtunkhwa, Pakistan',
  defaultEmail: 'emad2005jan@gmail.com',
  defaultEmailCc: 'imadk2709@gmail.com',
  defaultPhone: '923185512803',
  defaultLinkedin: 'https://www.linkedin.com/in/imad-khan-391b53387',
  fiverrUrl: 'https://www.fiverr.com/s/VYj7VXB',
};

export function resolveContactLinks(profile) {
  const socials = profile?.socials || {};
  return {
    email: profile?.email || SITE_CONFIG.defaultEmail,
    emailCc: SITE_CONFIG.defaultEmailCc,
    whatsapp: socials.whatsapp || `https://wa.me/${SITE_CONFIG.defaultPhone}`,
    phone: `tel:+${SITE_CONFIG.defaultPhone}`,
    linkedin: socials.linkedin || SITE_CONFIG.defaultLinkedin,
    github: socials.github || null,
    facebook: socials.facebook || null,
    instagram: socials.instagram || null,
    tiktok: socials.tiktok || null,
    fiverr: SITE_CONFIG.fiverrUrl,
  };
}

export function parseTechs(techs) {
  if (!techs) return [];
  return techs.split(',').map((t) => t.trim()).filter(Boolean);
}
