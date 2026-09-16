/**
 * Client-side helpers for the privacy-friendly page-view analytics
 * feature (visitor_analytics / analytics_events tables).
 *
 * This file handles:
 * - Anonymous session ID
 * - Anonymous visitor ID
 * - Traffic source / app classification
 * - Referrer domain
 * - UTM parameters
 * - Device type
 * - Browser
 * - Operating system
 * - Device brand/model
 * - In-app browser detection
 * - Approximate IP-based location
 */

const SESSION_ID_KEY = 'nexasolve_analytics_session_id';
const VISITOR_ID_KEY = 'nexasolve_analytics_visitor_id';

const SESSION_SOURCE_KEY = 'nexasolve_analytics_session_source';
const SESSION_REFERRER_DOMAIN_KEY =
  'nexasolve_analytics_session_referrer_domain';
const SESSION_UTM_KEY = 'nexasolve_analytics_session_utm';

function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });
}

/* =========================================================
   SESSION ID
========================================================= */

export function getOrCreateSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);

    if (!id) {
      id = generateUuid();
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }

    return id;
  } catch {
    return generateUuid();
  }
}

/* =========================================================
   ANALYTICS VISITOR ID
========================================================= */

export function getOrCreateAnalyticsVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);

    if (!id) {
      id = generateUuid();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }

    return id;
  } catch {
    return generateUuid();
  }
}

/* =========================================================
   SOURCE / APP CLASSIFICATION
========================================================= */

const KNOWN_HOSTS = {
  google: 'Google',
  bing: 'Bing',
  yahoo: 'Yahoo',
  duckduckgo: 'DuckDuckGo',

  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',

  youtube: 'YouTube',

  twitter: 'X/Twitter',
  'x.com': 'X/Twitter',

  whatsapp: 'WhatsApp',

  fiverr: 'Fiverr',
  upwork: 'Upwork',

  't.me': 'Telegram',
  telegram: 'Telegram',
};

/**
 * Closed Source/App set.
 *
 * Anything outside this list becomes "Other".
 */
const SOURCE_APP_VALUES = new Set([
  'Facebook',
  'Instagram',
  'TikTok',
  'LinkedIn',
  'WhatsApp',
  'Fiverr',
  'Upwork',
  'YouTube',
  'Google',
  'X/Twitter',
  'Direct',
  'Other',
]);

function normalizeSourceApp(label) {
  return SOURCE_APP_VALUES.has(label) ? label : 'Other';
}

/* =========================================================
   UTM
========================================================= */

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
];

function readUtmParamsFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);

    const result = {};

    for (const key of UTM_KEYS) {
      const value = params.get(key);

      result[key] = value ? value.trim() : null;
    }

    return result;
  } catch {
    return Object.fromEntries(
      UTM_KEYS.map((key) => [key, null])
    );
  }
}

/* =========================================================
   CLASSIFY SOURCE
========================================================= */

function classifySourceNow(utm) {
  /*
   * UTM source has highest priority.
   */
  if (utm?.utm_source) {
    const key = utm.utm_source.trim().toLowerCase();

    /*
     * X special case.
     */
    if (key === 'x') {
      return 'X/Twitter';
    }

    /*
     * Exact supported UTM source.
     */
    const knownSource = KNOWN_HOSTS[key];

    if (knownSource) {
      return normalizeSourceApp(knownSource);
    }

    /*
     * Unknown UTM source.
     */
    return 'Other';
  }

  /* =======================================================
     REFERRER FALLBACK
  ======================================================= */

  try {
    const ref = document.referrer;

    if (!ref) {
      return 'Direct';
    }

    const host = new URL(ref)
      .hostname
      .replace(/^www\./, '')
      .toLowerCase();

    /*
     * Internal navigation.
     */
    if (!host || host === window.location.hostname) {
      return 'Direct';
    }

    const match = Object.keys(KNOWN_HOSTS).find((key) =>
      host.includes(key)
    );

    if (!match) {
      return 'Other';
    }

    return normalizeSourceApp(KNOWN_HOSTS[match]);
  } catch {
    return 'Direct';
  }
}

/* =========================================================
   RAW REFERRER DOMAIN
========================================================= */

function referrerDomainNow() {
  try {
    const ref = document.referrer;

    if (!ref) {
      return null;
    }

    const host = new URL(ref)
      .hostname
      .replace(/^www\./, '')
      .toLowerCase();

    if (!host || host === window.location.hostname) {
      return null;
    }

    return host;
  } catch {
    return null;
  }
}

/* =========================================================
   SESSION ATTRIBUTION
========================================================= */

export function getSessionAttribution() {
  try {
    /*
     * If already calculated during this session,
     * return cached attribution.
     */
    const cachedSource =
      sessionStorage.getItem(SESSION_SOURCE_KEY);

    if (cachedSource) {
      const cachedDomain =
        sessionStorage.getItem(
          SESSION_REFERRER_DOMAIN_KEY
        );

      const cachedUtmRaw =
        sessionStorage.getItem(SESSION_UTM_KEY);

      let utm = Object.fromEntries(
        UTM_KEYS.map((key) => [key, null])
      );

      if (cachedUtmRaw) {
        try {
          utm = JSON.parse(cachedUtmRaw);
        } catch {
          // Keep empty UTM defaults.
        }
      }

      return {
        source: normalizeSourceApp(cachedSource),
        referrerDomain: cachedDomain || null,
        utm,
      };
    }

    /*
     * First page of this session.
     */
    const utm = readUtmParamsFromUrl();

    const source = classifySourceNow(utm);

    const referrerDomain = referrerDomainNow();

    /*
     * Cache for the rest of the session.
     */
    sessionStorage.setItem(
      SESSION_SOURCE_KEY,
      source
    );

    if (referrerDomain) {
      sessionStorage.setItem(
        SESSION_REFERRER_DOMAIN_KEY,
        referrerDomain
      );
    }

    sessionStorage.setItem(
      SESSION_UTM_KEY,
      JSON.stringify(utm)
    );

    return {
      source,
      referrerDomain,
      utm,
    };
  } catch {
    /*
     * Storage unavailable.
     */
    const utm = readUtmParamsFromUrl();

    return {
      source: classifySourceNow(utm),
      referrerDomain: referrerDomainNow(),
      utm,
    };
  }
}

/* =========================================================
   COMPATIBILITY EXPORT
========================================================= */

/**
 * Compatibility helper used by analyticsService.js.
 *
 * IMPORTANT:
 * analyticsService.js imports this function.
 */
export function getSessionReferrerSource() {
  return getSessionAttribution().source;
}

/* =========================================================
   DEVICE TYPE
========================================================= */

export function detectDeviceType() {
  try {
    const ua = navigator.userAgent || '';

    if (
      /tablet|ipad/i.test(ua) ||
      (/android/i.test(ua) && !/mobile/i.test(ua))
    ) {
      return 'Tablet';
    }

    if (/mobi|iphone|ipod|android/i.test(ua)) {
      return 'Mobile';
    }

    return 'Desktop';
  } catch {
    return null;
  }
}

/* =========================================================
   BROWSER
========================================================= */

export function detectBrowser() {
  try {
    const ua = navigator.userAgent || '';

    /*
     * Specific browsers first.
     */
    if (/samsungbrowser/i.test(ua)) {
      return 'Samsung Internet';
    }

    if (/edg\//i.test(ua)) {
      return 'Edge';
    }

    if (/opr\//i.test(ua) || /opera/i.test(ua)) {
      return 'Opera';
    }

    if (/chrome|crios/i.test(ua)) {
      return 'Chrome';
    }

    if (/firefox|fxios/i.test(ua)) {
      return 'Firefox';
    }

    if (/safari/i.test(ua) && !/android/i.test(ua)) {
      return 'Safari';
    }

    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/* =========================================================
   OPERATING SYSTEM
========================================================= */

export function detectOperatingSystem() {
  try {
    const ua = navigator.userAgent || '';

    if (/cros/i.test(ua)) {
      return 'ChromeOS';
    }

    if (/windows/i.test(ua)) {
      return 'Windows';
    }

    if (/iphone|ipad|ipod/i.test(ua)) {
      return 'iOS';
    }

    if (/android/i.test(ua)) {
      return 'Android';
    }

    if (/mac os/i.test(ua)) {
      return 'macOS';
    }

    if (/linux/i.test(ua)) {
      return 'Linux';
    }

    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/* =========================================================
   DEVICE BRAND / MODEL
========================================================= */

export function detectDeviceBrand() {
  try {
    const ua = navigator.userAgent || '';

    const match =
      ua.match(
        /Android\s[\d.]+;\s*([^;)]+)\)/i
      ) ||
      ua.match(
        /Android\s[\d.]+;\s*([^;)]+);/i
      );

    if (!match) {
      return null;
    }

    const model = match[1].trim();

    if (
      !model ||
      /^(K|wv|Mobile|Tablet)$/i.test(model)
    ) {
      return null;
    }

    return model;
  } catch {
    return null;
  }
}

/* =========================================================
   IN-APP BROWSER DETECTION
========================================================= */

const IN_APP_SIGNATURES = [
  {
    pattern: /\bFBAN|\bFBAV|FB_IAB/i,
    label: 'Facebook In-App Browser',
  },

  {
    pattern: /\bInstagram\b/i,
    label: 'Instagram In-App Browser',
  },

  {
    pattern: /\bMessenger\b/i,
    label: 'Messenger In-App Browser',
  },

  {
    pattern: /musical_ly|BytedanceWebview|\bTikTok\b/i,
    label: 'TikTok In-App Browser',
  },

  {
    pattern: /\bLinkedInApp\b/i,
    label: 'LinkedIn In-App Browser',
  },

  {
    pattern: /\bTelegram\b/i,
    label: 'Telegram In-App Browser',
  },

  {
    pattern: /\bWhatsApp\b/i,
    label: 'WhatsApp In-App Browser',
  },
];

export function detectBrowserEnvironment() {
  try {
    const ua = navigator.userAgent || '';

    const match = IN_APP_SIGNATURES.find(
      ({ pattern }) => pattern.test(ua)
    );

    return match ? match.label : null;
  } catch {
    return null;
  }
}

/* =========================================================
   APPROXIMATE LOCATION
========================================================= */

export async function fetchApproxLocation() {
  try {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      3000
    );

    const res = await fetch(
      'https://ipwho.is/',
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        country: null,
        region: null,
        city: null,
      };
    }

    const data = await res.json();

    if (!data?.success) {
      return {
        country: null,
        region: null,
        city: null,
      };
    }

    return {
      country: data.country || null,
      region: data.region || null,
      city: data.city || null,
    };
  } catch {
    return {
      country: null,
      region: null,
      city: null,
    };
  }
}