/**
 * Every locale's landing-page copy. Build-time only, like `../index.ts`: each
 * page inlines just its own locale's strings and sample.
 */
import type { LandingDictionary, LocaleCode } from '../landing';
import en from './en';
import zh from './zh';
import ja from './ja';
import ko from './ko';
import es from './es';
import pt from './pt';
import fr from './fr';
import de from './de';
import ru from './ru';

export const LANDING_COPY: { [L in LocaleCode]: LandingDictionary<L> } = { en, zh, ja, ko, es, pt, fr, de, ru };
