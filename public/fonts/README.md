# Bundled fonts

Regenerate with `npm run fonts` (`scripts/prepare_fonts.py`). Every source is
an official release, pinned by URL and SHA-256 in that script, and every font
is licensed under the [SIL Open Font License 1.1](https://openfontlicense.org)
except DejaVu Sans Mono (Bitstream Vera licence, public-domain additions).

| Files | Source | What was done to it |
| --- | --- | --- |
| `NotoSans-{Regular,Bold,Italic,BoldItalic}.ttf` | [notofonts/latin-greek-cyrillic](https://github.com/notofonts/latin-greek-cyrillic/releases/tag/NotoSans-v2.015) NotoSans v2.015, unhinted TTF | Subset to Latin (incl. Latin Extended Additional for Vietnamese, IPA), Greek (incl. polytonic), Cyrillic (incl. supplement), punctuation and common symbols |
| `NotoSans-*.core.woff2`, `NotoSans-*.ext.woff2` | the above | WOFF2 for the browser preview only, split into a Latin core and the rest (Greek, Cyrillic, Vietnamese, symbols) |
| `DejaVuSansMono.ttf` | [typst-assets v0.13.1](https://github.com/typst/typst-assets) | Subset to the same ranges |
| `NotoSansArabic-*.ttf` | [notofonts/arabic](https://github.com/notofonts/arabic/releases/tag/NotoSansArabic-v2.013) NotoSansArabic v2.013, unhinted | Basic Latin from Noto Sans merged in (for mixed-script diagram labels) |
| `NotoSansHebrew-*.ttf` | [notofonts/hebrew](https://github.com/notofonts/hebrew/releases/tag/NotoSansHebrew-v3.001) v3.001, unhinted | Same merge |
| `NotoSansDevanagari-*.ttf` | [notofonts/devanagari](https://github.com/notofonts/devanagari/releases/tag/NotoSansDevanagari-v2.007) v2.007, unhinted | Same merge |
| `NotoSansThai-*.ttf` | [notofonts/thai](https://github.com/notofonts/thai/releases/tag/NotoSansThai-v2.002) v2.002, unhinted | Same merge |
| `NotoSans{Arabic,Hebrew,Devanagari,Thai}-*.woff2` | the above | WOFF2 for the preview |
| `NotoSansSC-*.{subset,full}.otf` | [notofonts/noto-cjk Sans2.004](https://github.com/notofonts/noto-cjk/releases/tag/Sans2.004), `18_NotoSansSC.zip` (region-specific subset OTF) | Subset: GB2312 + punctuation (7,836 codepoints). Full: every codepoint. Both desubroutinised, hints dropped |
| `NotoSansTC-*.{subset,full}.otf` | same release, `19_NotoSansTC.zip` | Subset: Big5 level 1 + symbols + bopomofo (6,242). Full: every codepoint |
| `NotoSansJP-*.{subset,full}.otf` | same release, `16_NotoSansJP.zip` | Subset: JIS X 0208 levels 1+2 + kana + the 2010 Jōyō additions (7,314). Full: every codepoint |
| `NotoSansKR-*.{subset,full}.otf` | same release, `17_NotoSansKR.zip` | Subset: KS X 1001 without Hanja, i.e. 2,350 Hangul syllables + jamo + symbols (3,939). Full: all 11,172 syllables and 8,138 Hanja |
| `NotoSerif-{Regular,Bold,Italic,BoldItalic}.ttf` | [notofonts/latin-greek-cyrillic](https://github.com/notofonts/latin-greek-cyrillic/releases/tag/NotoSerif-v2.015) NotoSerif v2.015, unhinted TTF | Subset to the same ranges as Noto Sans. Serif templates only |
| `NotoSerif-*.core.woff2`, `NotoSerif-*.ext.woff2` | the above | WOFF2 for the preview, split like Noto Sans |
| `NotoSerif{SC,TC,JP,KR}-Regular.subset.otf` | [notofonts/noto-cjk Serif2.003](https://github.com/notofonts/noto-cjk/releases/tag/Serif2.003), `14_NotoSerifSC.zip`, `15_NotoSerifTC.zip`, `12_NotoSerifJP.zip`, `13_NotoSerifKR.zip` | Regular weight only, subset to exactly the sans subsets' character sets (7,836 / 6,242 / 7,314 / 3,939 codepoints, none missing), desubroutinised, hints dropped. Serif templates only; bold CJK and rarer characters use the sans faces |
| `NotoSansMath-Regular.ttf` | [notofonts/math](https://github.com/notofonts/math), unhinted TTF, pinned to a commit of notofonts.github.io | Unmodified: Typst needs the MATH table and its glyph variants. Loaded only for documents with formulas, by the PDF and the preview (`src/preview/math.css`) alike |
| `coverage-scripts.bin`, `coverage-cjk.bin` | generated from the cmaps above, plus the simplified-only and traditional-only character sets (GB2312 level 1 and Big5 level 1) | Run-length codepoint maps; see `decodeCoverage` in `src/typst/fonts.ts` |

The subsets serve the common case at a fraction of the download; the full
faces are fetched only when a document contains characters its subset lacks,
so rare characters never render as tofu. Desubroutinised CFF without hints is
what compresses best over brotli (e.g. Japanese full: 3.36 MB as released,
2.56 MB like this). The largest file is 7.2 MiB, under Cloudflare Pages' 25 MiB
per-file limit.

Why no WOFF2 for the CJK faces: Typst cannot read WOFF2, and the preview uses
the PDF's OTF files so that a document previewed and then downloaded fetches
them once; over brotli they are about as small as WOFF2 would be.
