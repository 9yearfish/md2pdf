/**
 * Minimal, privacy-conscious Google Analytics 4 integration.
 *
 * gtag.js is production-only and is not loaded unless the build has a valid
 * VITE_GA_MEASUREMENT_ID. Analytics storage and every advertising consent
 * category are denied before it loads, so GA4 receives cookieless measurements,
 * not an analytics cookie or a stable browser identifier.
 *
 * Never add document-derived values to events in this file. A heading, file
 * name, error message or document language may reveal what somebody is
 * converting. The only custom event is the fact that a PDF was exported.
 */

type DataLayerEntry = IArguments | unknown[] | Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: DataLayerEntry[];
  }
}

const measurementId = (import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim();
const enabled = import.meta.env.PROD && /^G-[A-Z0-9]+$/i.test(measurementId);

function gtag(..._args: unknown[]): void {
  // Google documents this API as pushing the function's arguments object.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer?.push(arguments);
}

/** Keep campaign attribution while excluding arbitrary query data and hashes. */
function pageLocation(): string {
  const url = new URL(location.href);
  const allowed = new Set([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_id',
    'utm_term',
    'utm_content',
    'utm_source_platform',
    'utm_creative_format',
    'utm_marketing_tactic',
    'gclid',
    'dclid',
    'gbraid',
    'wbraid',
  ]);
  for (const key of [...url.searchParams.keys()]) {
    if (!allowed.has(key)) url.searchParams.delete(key);
  }
  url.hash = '';
  return url.href;
}

/** Referrer paths help diagnose traffic; their query strings do not. */
function pageReferrer(): string | undefined {
  if (!document.referrer) return undefined;
  try {
    const url = new URL(document.referrer);
    url.search = '';
    url.hash = '';
    return url.href;
  } catch {
    return undefined;
  }
}

if (enabled) {
  window.dataLayer = window.dataLayer ?? [];
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });
  gtag('set', {
    ads_data_redaction: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  gtag('js', new Date());
  gtag('config', measurementId, {
    page_location: pageLocation(),
    page_referrer: pageReferrer(),
    send_page_view: true,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.append(script);
}

/** Record a completed export without sending its file name or document data. */
export function trackPdfExport(method: 'download' | 'print'): void {
  if (!enabled) return;
  gtag('event', 'pdf_export', { method });
}
