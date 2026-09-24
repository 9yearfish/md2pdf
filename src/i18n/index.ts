/**
 * Every locale the site is built in. Build-time only: the app never imports
 * this, because it would bundle all dictionaries into every page. Each page
 * gets its own locale's runtime strings inlined by the build (see
 * vite.config.ts and runtime.ts).
 *
 * To add a locale: write `src/i18n/<code>.ts` (copy en.ts; the `Messages` type
 * flags anything missing), then import it here and add it to the list.
 * The first entry is the default locale, served at `/` and used as x-default.
 */
import type { Messages } from './types';
import en from './en';
import zh from './zh';
import ja from './ja';
import ko from './ko';
import es from './es';
import pt from './pt';
import fr from './fr';
import de from './de';
import ru from './ru';

export const LOCALES: readonly Messages[] = [en, zh, ja, ko, es, pt, fr, de, ru];

export const DEFAULT_LOCALE = LOCALES[0];

/** `/` for the default locale, `/<code>/` for the rest. */
export function localePath(messages: Messages): string {
  return messages === DEFAULT_LOCALE ? '/' : `/${messages.locale.code}/`;
}
