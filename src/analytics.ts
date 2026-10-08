/**
 * Minimal, privacy-conscious Google Tag Manager integration.
 *
 * The container is production-only and is not loaded unless the build has a
 * valid VITE_GTM_CONTAINER_ID. Analytics storage and every advertising consent
 * category are denied before GTM loads. Google tags in the container therefore
 * receive cookieless measurements, not an analytics cookie or a stable browser
 * identifier.
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

const containerId = (import.meta.env.VITE_GTM_CONTAINER_ID ?? '').trim();
const enabled = import.meta.env.PROD && /^GTM-[A-Z0-9]+$/i.test(containerId);

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
  // These privacy-filtered values are available as Data Layer Variables for
  // the GA4 page-view tag in GTM. Do not use the raw Page URL/Referrer there.
  window.dataLayer.push({
    'gtm.start': Date.now(),
    event: 'gtm.js',
    analytics_page_location: pageLocation(),
    analytics_page_referrer: pageReferrer(),
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
  document.head.append(script);
}

/** Record a completed export without sending its file name or document data. */
export function trackPdfExport(method: 'download' | 'print'): void {
  if (!enabled) return;
  window.dataLayer?.push({ event: 'pdf_export', method });
}
