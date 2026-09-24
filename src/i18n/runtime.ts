/**
 * The current page's strings, at runtime.
 *
 * Each prerendered page carries its own locale's UI strings and sample as a
 * JSON data block (`<script type="application/json">`, which the CSP allows
 * because it is never executed). Reading it synchronously means no extra
 * request and no flash of another language, and a page never ships the other
 * locales' dictionaries.
 */
import { LANG_PREF_KEY, LOCALE_DATA_ID } from './constants';
import type { PluralForms, RuntimeLocale, UiMessages } from './types';

function read(): RuntimeLocale {
  const node = document.getElementById(LOCALE_DATA_ID);
  if (!node?.textContent) throw new Error(`missing #${LOCALE_DATA_ID}`);
  return JSON.parse(node.textContent) as RuntimeLocale;
}

const data = read();

export const locale = data.code;
/** BCP 47 tag for Intl formatting. */
export const lang = data.lang;
export const sample = data.sample;
/** The landing page's slug, or null on a locale's home page. */
export const landing = data.landing ?? null;

type Vars = Record<string, string | number>;
type TextKey = { [K in keyof UiMessages]: UiMessages[K] extends string ? K : never }[keyof UiMessages];
type PluralKey = { [K in keyof UiMessages]: UiMessages[K] extends PluralForms ? K : never }[keyof UiMessages];

function fill(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/** A UI string with `{name}` placeholders filled in. */
export function t(key: TextKey, vars?: Vars): string {
  return fill(data.ui[key], vars);
}

const plurals = new Intl.PluralRules(lang);
const numbers = new Intl.NumberFormat(lang);

/** A count, in the right grammatical number, e.g. "1 word" / "5 words". */
export function plural(key: PluralKey, n: number): string {
  const forms = data.ui[key];
  const form = forms[plurals.select(n) as keyof PluralForms] ?? forms.other;
  return fill(form, { n: numbers.format(n) });
}

/**
 * Store an explicit language choice so the `/` redirect respects it. Returns
 * false where storage is unavailable (some private modes), in which case the
 * choice holds for this navigation only.
 */
export function rememberLanguage(code: string): boolean {
  try {
    localStorage.setItem(LANG_PREF_KEY, code);
    return true;
  } catch {
    return false;
  }
}
