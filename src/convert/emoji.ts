/**
 * Emoji are Unicode grapheme clusters, not individual code points. A family,
 * flag, skin-tone variant or keycap must stay together when it is handed to a
 * colour font. `Intl.Segmenter` follows the same extended-grapheme rules the
 * browser uses for cursor movement and selection.
 */
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

const DEFAULT_EMOJI = /\p{Emoji_Presentation}/u;
const EMOJI_CODEPOINT = /\p{Emoji}/u;
const VS15 = '\uFE0E';
const VS16 = '\uFE0F';
const KEYCAP = '\u20E3';

/** Whether one complete grapheme should use the colour emoji face. */
export function isEmojiGrapheme(value: string): boolean {
  // VS15 explicitly asks for text presentation, even when the base normally
  // defaults to emoji (for example, ⌚︎). Respect that request.
  if (value.includes(VS15)) return false;
  // Emoji_Presentation covers the default-colour repertoire, including
  // regional indicators used by flags. VS16 asks for colour presentation for
  // otherwise textual symbols such as ❤️ and ✈️. U+20E3 identifies
  // keycap sequences whose base is an ordinary digit, # or *.
  return DEFAULT_EMOJI.test(value) ||
    (value.includes(VS16) && EMOJI_CODEPOINT.test(value)) ||
    value.includes(KEYCAP);
}

/** Distinct colour-emoji graphemes in source order. */
export function emojiGraphemes(value: string): string[] {
  return [...new Set(emojiRuns(value).filter(run => run.emoji).map(run => run.value))];
}

export interface EmojiRun {
  value: string;
  emoji: boolean;
}

/** Split text into colour-emoji clusters and maximal runs of ordinary text. */
export function emojiRuns(value: string): EmojiRun[] {
  const runs: EmojiRun[] = [];
  let text = '';
  for (const part of graphemes.segment(value)) {
    const segment = part.segment;
    if (!isEmojiGrapheme(segment)) {
      text += segment;
      continue;
    }
    if (text) runs.push({ value: text, emoji: false });
    runs.push({ value: segment, emoji: true });
    text = '';
  }
  if (text) runs.push({ value: text, emoji: false });
  return runs;
}
