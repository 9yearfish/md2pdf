# Bundled fonts

Regenerate with `python3 scripts/prepare_fonts.py` (see that file for details).

| File | Source | Licence |
| --- | --- | --- |
| `LibertinusSerif-*.otf` | [typst-assets](https://github.com/typst/typst-assets) | SIL OFL 1.1 |
| `DejaVuSansMono.ttf` | [typst-assets](https://github.com/typst/typst-assets) | Bitstream Vera / public domain |
| `NotoSansSC-*.subset.ttf` | Noto Sans SC, subset to GB2312 + punctuation | SIL OFL 1.1 |
| `NotoSansSC-*.full.ttf` | Noto Sans SC, unmodified | SIL OFL 1.1 |
| `subset-coverage.bin` | Generated from the subset's cmap | — |

The subset faces cover 7,696 codepoints and serve the common case at roughly a
fifth of the download. The full faces are fetched only when a document contains
characters the subset lacks, so rare characters never render as tofu.
