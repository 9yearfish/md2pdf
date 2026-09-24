#!/usr/bin/env python3
"""Regenerate everything under public/fonts/.

The font binaries are committed so that neither the build nor the deploy needs
network access or Python. This script documents their provenance and makes
them reproducible from the official Noto releases:

    pip install fonttools brotli
    python3 scripts/prepare_fonts.py            # downloads into .font-cache/
    python3 scripts/prepare_fonts.py serif      # one step: latin, scripts, cjk, serif, coverage

After regenerating, bump FONT_REVISION in src/typst/fonts.ts if any file
changed in place: fonts are served as immutable.

Every source archive is pinned by URL and SHA-256. Downloads are cached in
`.font-cache/` (or `$MD2PDF_FONT_CACHE`), so a rerun is offline.

What it produces, per script:

- Latin, Greek, Cyrillic, Vietnamese: Noto Sans in four styles, subset to the
  blocks prose realistically uses. Always loaded.
- Code: DejaVu Sans Mono, subset the same way.
- Arabic, Hebrew, Devanagari, Thai: the Noto Sans face for that script, with
  Noto Sans' basic Latin merged in. The merge matters for diagrams: resvg
  shapes an SVG text run with one font and only falls back glyph by glyph,
  which breaks Arabic joining when a label mixes scripts. A face that covers
  the whole label shapes it in one go.
- Chinese (Simplified and Traditional), Japanese, Korean: the region-specific
  Noto Sans CJK faces, twice each: a subset built from the national standard
  character set (GB2312, Big5 level 1, JIS X 0208, KS X 1001 Hangul) for the
  common case, and the full face for documents that go beyond it. Both are
  desubroutinised CFF without hints, which is what compresses best.
- Serif templates only: Noto Serif in four styles, subset like Noto Sans, and
  the regular weight of Noto Serif CJK (SC, TC, JP, KR) subset to the same
  national character sets as the sans subsets. Bold CJK in a serif document
  is set in the sans face, so there is no serif CJK bold and no full face:
  characters beyond the subset fall back to the sans face.
- Maths: Noto Sans Math, unhinted and unmodified: Typst needs its MATH table
  and the glyph variants it points at, so it is not subset. Loaded only for
  documents with formulas, by the PDF and the preview alike.
- WOFF2 copies of the Latin and script faces, for the browser preview.
- coverage-*.bin: the codepoint coverage of every face as run lengths, so the
  app can pick the smallest sufficient faces before downloading any of them,
  plus the simplified-only and traditional-only character sets used to tell
  Simplified from Traditional Chinese.
"""
from __future__ import annotations

import hashlib
import os
import shutil
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "fonts"
CACHE = Path(os.environ.get("MD2PDF_FONT_CACHE", ROOT / ".font-cache"))
WORK = CACHE / "work"

GH = "https://github.com/notofonts"
SOURCES = {
    "latin": (f"{GH}/latin-greek-cyrillic/releases/download/NotoSans-v2.015/NotoSans-v2.015.zip",
              "0c34df072a3fa7efbb7cbf34950e1f971a4447cffe365d3a359e2d4089b958f5"),
    "arabic": (f"{GH}/arabic/releases/download/NotoSansArabic-v2.013/NotoSansArabic-v2.013.zip",
               "1301aceaea84c501cf2e6dcfb3182e2328c8eae5725817fcb239672bda7154f1"),
    "hebrew": (f"{GH}/hebrew/releases/download/NotoSansHebrew-v3.001/NotoSansHebrew-v3.001.zip",
               "df0a71814b4e63644cf40fcc4529111b61266b7a2dafbe95068b29a7520cc3cb"),
    "thai": (f"{GH}/thai/releases/download/NotoSansThai-v2.002/NotoSansThai-v2.002.zip",
             "af889cc673fc714060ce5e4e088fbad32aa4c0571a19958efeaff128a22da485"),
    "devanagari": (f"{GH}/devanagari/releases/download/NotoSansDevanagari-v2.007/NotoSansDevanagari-v2.007.zip",
                   "820c7da45b1e63562cb41c0a8cac5d9a4202312043a3a040ed1325857ef469b1"),
    "sc": (f"{GH}/noto-cjk/releases/download/Sans2.004/18_NotoSansSC.zip",
           "4d107c09ada479d3e48b6e78c83835773cbd9214bf6e12cdb7b60f8e068292ec"),
    "tc": (f"{GH}/noto-cjk/releases/download/Sans2.004/19_NotoSansTC.zip",
           "fbbcb216be8056a436c7ec142847f302bb1932d07bdad8b322f4953a389d7cbc"),
    "jp": (f"{GH}/noto-cjk/releases/download/Sans2.004/16_NotoSansJP.zip",
           "2bbdd2c20f30670b39ca735c96d75f1fdabdb348103e43b820cf17701fd22b18"),
    "kr": (f"{GH}/noto-cjk/releases/download/Sans2.004/17_NotoSansKR.zip",
           "ac7eeb4e2b0d41de8ff31b2d6e1e2a41caf253fd5cefb380bfa1f40f1747b612"),
    "serif": (f"{GH}/latin-greek-cyrillic/releases/download/NotoSerif-v2.015/NotoSerif-v2.015.zip",
              "0e9a43c8a4b94ac76f55069ed1d7385bbcaf6b99527a94deb5619e032b7e76c1"),
    "serif-sc": (f"{GH}/noto-cjk/releases/download/Serif2.003/14_NotoSerifSC.zip",
                 "c58cd035ab2adb003510846db9ec80c35b1b97755d329486c3a1e88edfe6e98e"),
    "serif-tc": (f"{GH}/noto-cjk/releases/download/Serif2.003/15_NotoSerifTC.zip",
                 "cadfc894416096a51174e8a350e5cb872f99a8c4b1d36c3990e7a9741e1456ab"),
    "serif-jp": (f"{GH}/noto-cjk/releases/download/Serif2.003/12_NotoSerifJP.zip",
                 "53bdd2a6e4eb63bf24f7890e018dddb94366e3555d0814c72b74fbb128f328f0"),
    "serif-kr": (f"{GH}/noto-cjk/releases/download/Serif2.003/13_NotoSerifKR.zip",
                 "ac3398873346bc97e00a9652afe791cad6a2df3e5f157c4e7d40ce60b2b88605"),
    "mono": ("https://raw.githubusercontent.com/typst/typst-assets/v0.13.1/files/fonts/DejaVuSansMono.ttf",
             "b4a6c3e4faab8773f4ff761d56451646409f29abedd68f05d38c2df667d3c582"),
    # Pinned to a commit of the notofonts build repository.
    "math": ("https://raw.githubusercontent.com/notofonts/notofonts.github.io/"
             "55773c3eb233b5a0eaa07de6226da189b136b4f0/fonts/NotoSansMath/unhinted/ttf/NotoSansMath-Regular.ttf",
             "b127e84699212b6b2ef50aff58e0ebebeec04ffe6db1b9eb9e209c8c3d97b4aa"),
}

# Latin (incl. Vietnamese and IPA), Greek (incl. polytonic), Cyrillic (incl.
# the supplement), punctuation, super/subscripts, currency, letterlike, number
# forms, arrows, maths operators, box drawing, shapes, symbols, ligatures.
LATIN_RANGES = ",".join([
    "U+0020-02FF", "U+0300-036F", "U+0370-03FF", "U+0400-052F",
    "U+1E00-1EFF", "U+1F00-1FFF", "U+2000-206F", "U+2070-209F",
    "U+20A0-20CF", "U+2100-214F", "U+2150-218F", "U+2190-21FF",
    "U+2200-22FF", "U+2500-257F", "U+25A0-25FF", "U+2600-26FF",
    "U+FB00-FB06", "U+FFFD",
])

# What gets merged into the non-Latin script faces (see the module docstring).
LATIN_FOR_SCRIPTS = "U+0020-007E,U+00A0-00FF,U+2000-206F,U+20AC"

LATIN_STYLES = ["Regular", "Bold", "Italic", "BoldItalic"]
SCRIPTS = {  # key -> file stem inside the release archive
    "arabic": "NotoSansArabic",
    "hebrew": "NotoSansHebrew",
    "thai": "NotoSansThai",
    "devanagari": "NotoSansDevanagari",
}
CJK = {"sc": "NotoSansSC", "tc": "NotoSansTC", "jp": "NotoSansJP", "kr": "NotoSansKR"}
WEIGHTS = ["Regular", "Bold"]


# ---------------------------------------------------------------- sources

def fetch(key: str) -> Path:
    url, digest = SOURCES[key]
    target = CACHE / url.rsplit("/", 1)[1]
    if not target.exists():
        print(f"  download {url}")
        CACHE.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(url, timeout=600) as response:
            data = response.read()
        target.write_bytes(data)
    actual = hashlib.sha256(target.read_bytes()).hexdigest()
    if actual != digest:
        sys.exit(f"checksum mismatch for {target.name}: {actual}")
    return target


def extract(key: str, member_suffix: str) -> Path:
    """Pull one file out of a release archive, by the end of its path."""
    archive = fetch(key)
    WORK.mkdir(parents=True, exist_ok=True)
    target = WORK / member_suffix.rsplit("/", 1)[-1]
    if target.exists():
        return target
    with zipfile.ZipFile(archive) as z:
        names = [n for n in z.namelist() if n.endswith(member_suffix)]
        if not names:
            sys.exit(f"{member_suffix} not found in {archive.name}")
        target.write_bytes(z.read(sorted(names, key=len)[0]))
    return target


def subset(source: Path, target: Path, *, unicodes: str = "", unicodes_file: Path | None = None,
           desubroutinize: bool = True) -> None:
    args = [
        sys.executable, "-m", "fontTools.subset", str(source),
        f"--output-file={target}",
        "--layout-features=*", "--no-hinting", "--name-IDs=*", "--notdef-outline",
    ]
    if desubroutinize:
        args.append("--desubroutinize")
    args.append(f"--unicodes-file={unicodes_file}" if unicodes_file else f"--unicodes={unicodes}")
    subprocess.run(args, check=True)


# ---------------------------------------------------------------- character sets

def decode_dbcs(codec: str, leads: range, trails: range = range(0xA1, 0xFF)) -> set[int]:
    cps: set[int] = set()
    for hi in leads:
        for lo in trails:
            try:
                text = bytes([hi, lo]).decode(codec)
            except UnicodeDecodeError:
                continue
            if len(text) == 1:
                cps.add(ord(text))
    return cps


def common_ranges() -> set[int]:
    """Latin and punctuation every CJK subset carries.

    Needed even though Noto Sans sets the Latin in prose: in a diagram label
    that contains CJK, the CJK face sets the whole label (see mermaid.ts).
    """
    cps = set(range(0x20, 0x7F)) | set(range(0xA0, 0x180))
    cps |= set(range(0x2000, 0x2070))  # general punctuation
    cps |= set(range(0x3000, 0x3040))  # CJK symbols and punctuation
    cps |= set(range(0xFF00, 0xFFF0))  # halfwidth and fullwidth forms
    cps |= {0x00B7, 0x00D7, 0x00F7, 0x2014, 0x2026, 0x2116, 0x2192, 0x2190, 0x2191, 0x2193}
    return cps


def gb2312() -> set[int]:
    return decode_dbcs("gb2312", range(0xA1, 0xF8))


def gb2312_level1() -> set[int]:
    return {c for c in decode_dbcs("gb2312", range(0xB0, 0xD8)) if 0x4E00 <= c <= 0x9FFF}


def big5_level1() -> set[int]:
    # Big5 level 1 is the 5,401 frequently used hanzi, A440-C67E.
    cps = set()
    for code in range(0xA440, 0xC67F):
        hi, lo = code >> 8, code & 0xFF
        if not (0x40 <= lo <= 0x7E or 0xA1 <= lo <= 0xFE):
            continue
        try:
            cps.add(ord(bytes([hi, lo]).decode("big5")))
        except UnicodeDecodeError:
            pass
    return cps


def big5_symbols() -> set[int]:
    cps = set()
    for hi in range(0xA1, 0xA4):
        for lo in list(range(0x40, 0x7F)) + list(range(0xA1, 0xFF)):
            try:
                cps.add(ord(bytes([hi, lo]).decode("big5")))
            except UnicodeDecodeError:
                pass
    return cps


def set_sc() -> set[int]:
    return common_ranges() | gb2312()


def set_tc() -> set[int]:
    cps = common_ranges() | big5_symbols() | big5_level1()
    cps |= set(range(0x3100, 0x3130)) | set(range(0x31A0, 0x31C0))  # bopomofo
    return cps


def set_jp() -> set[int]:
    cps = common_ranges() | decode_dbcs("euc_jp", range(0xA1, 0xFF))  # JIS X 0208
    cps |= set(range(0x3040, 0x3100)) | set(range(0x31F0, 0x3200))  # kana
    # Joyo kanji added in 2010 that JIS X 0208 lacks.
    cps |= {0x20B9F, 0x5861, 0x525D, 0x9830}
    return cps


def set_kr() -> set[int]:
    # KS X 1001 without its Hanja rows (lead bytes CA-FD): symbols, the 2,350
    # common Hangul syllables and compatibility jamo, kana, Greek, Cyrillic.
    cps = common_ranges() | decode_dbcs("euc_kr", range(0xA1, 0xCA))
    cps |= set(range(0x1100, 0x1200)) | set(range(0x3130, 0x3190))  # jamo
    return {c for c in cps if not (0x4E00 <= c <= 0x9FFF)}


# ---------------------------------------------------------------- builds

def build_latin() -> None:
    for style in LATIN_STYLES:
        source = extract("latin", f"NotoSans/unhinted/ttf/NotoSans-{style}.ttf")
        print(f"  NotoSans-{style}.ttf")
        subset(source, OUT / f"NotoSans-{style}.ttf", unicodes=LATIN_RANGES)
    print("  DejaVuSansMono.ttf")
    subset(fetch("mono"), OUT / "DejaVuSansMono.ttf", unicodes=LATIN_RANGES)


def build_math() -> None:
    print("  NotoSansMath-Regular.ttf")
    shutil.copyfile(fetch("math"), OUT / "NotoSansMath-Regular.ttf")


def build_scripts() -> None:
    from fontTools.merge import Merger, Options

    for key, stem in SCRIPTS.items():
        for weight in WEIGHTS:
            source = extract(key, f"{stem}/unhinted/ttf/{stem}-{weight}.ttf")
            latin = WORK / f"latin-for-{key}-{weight}.ttf"
            subset(extract("latin", f"NotoSans/unhinted/ttf/NotoSans-{weight}.ttf"), latin,
                   unicodes=LATIN_FOR_SCRIPTS)
            # The script face goes first: it keeps its own names, metrics and
            # any codepoint both define.
            merged = Merger(options=Options(drop_tables=["vhea", "vmtx"])).merge([str(source), str(latin)])
            merged.save(OUT / f"{stem}-{weight}.ttf")
            print(f"  {stem}-{weight}.ttf")


def build_cjk() -> None:
    sets = {"sc": set_sc(), "tc": set_tc(), "jp": set_jp(), "kr": set_kr()}
    for key, stem in CJK.items():
        cps = sets[key]
        listing = WORK / f"{key}-unicodes.txt"
        listing.write_text(",".join(f"U+{c:04X}" for c in sorted(cps)))
        for weight in WEIGHTS:
            source = extract(key, f"{stem}-{weight}.otf")
            print(f"  {stem}-{weight}: subset of {len(cps)} codepoints, and full")
            subset(source, OUT / f"{stem}-{weight}.subset.otf", unicodes_file=listing)
            subset(source, OUT / f"{stem}-{weight}.full.otf", unicodes="*")


def build_serif() -> None:
    """Faces for the serif templates (Academic, Letter), loaded only when used."""
    from fontTools.ttLib import TTFont

    for style in LATIN_STYLES:
        source = extract("serif", f"NotoSerif/unhinted/ttf/NotoSerif-{style}.ttf")
        print(f"  NotoSerif-{style}.ttf")
        subset(source, OUT / f"NotoSerif-{style}.ttf", unicodes=LATIN_RANGES)
        for part, ranges in (("core", WOFF2_LATIN_CORE), ("ext", WOFF2_LATIN_EXT)):
            target = OUT / f"NotoSerif-{style}.{part}.woff2"
            subset(OUT / f"NotoSerif-{style}.ttf", target, unicodes=ranges)
            font = TTFont(target)
            font.flavor = "woff2"
            font.save(target)
    sets = {"sc": set_sc(), "tc": set_tc(), "jp": set_jp(), "kr": set_kr()}
    for key, stem in CJK.items():
        serif_stem = stem.replace("Sans", "Serif")
        listing = WORK / f"{key}-serif-unicodes.txt"
        listing.write_text(",".join(f"U+{c:04X}" for c in sorted(sets[key])))
        source = extract(f"serif-{key}", f"{serif_stem}-Regular.otf")
        target = OUT / f"{serif_stem}-Regular.subset.otf"
        subset(source, target, unicodes_file=listing)
        # The sans subset's coverage decides when the full face is needed, so
        # say how much of it the serif face lacks (those fall back to sans).
        sans = cmap(OUT / f"{stem}-Regular.subset.otf") if (OUT / f"{stem}-Regular.subset.otf").exists() else set()
        lacking = len(sans - cmap(target))
        print(f"  {target.name}: {len(cmap(target))} codepoints; {lacking} of the sans subset's fall back to sans")


# The preview's Latin faces come in two parts, split by unicode-range in
# src/fonts.css, so an English page only fetches the first. Keep in sync.
WOFF2_LATIN_CORE = "U+0000-024F,U+02B0-02FF,U+0300-036F,U+2000-206F,U+2070-209F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2212,U+25A0-25FF,U+FB00-FB06,U+FFFD"
WOFF2_LATIN_EXT = "U+0250-02AF,U+0370-03FF,U+0400-052F,U+1E00-1EFF,U+1F00-1FFF,U+2150-218F,U+2200-2211,U+2213-22FF,U+2500-257F,U+2600-26FF"


def build_woff2() -> None:
    """WOFF2 copies of the small faces, for the browser preview only.

    Typst cannot read WOFF2, so the PDF keeps using the TTFs. The CJK faces get
    no WOFF2 copy on purpose: the preview uses the same OTF files as the PDF,
    so a document that is previewed and then downloaded fetches them once.
    """
    from fontTools.ttLib import TTFont

    count = 0
    for style in LATIN_STYLES:
        for part, ranges in (("core", WOFF2_LATIN_CORE), ("ext", WOFF2_LATIN_EXT)):
            target = OUT / f"NotoSans-{style}.{part}.woff2"
            subset(OUT / f"NotoSans-{style}.ttf", target, unicodes=ranges)
            font = TTFont(target)
            font.flavor = "woff2"
            font.save(target)
            count += 1
    for stem in SCRIPTS.values():
        for weight in WEIGHTS:
            font = TTFont(OUT / f"{stem}-{weight}.ttf")
            font.flavor = "woff2"
            font.save(OUT / f"{stem}-{weight}.woff2")
            count += 1
    print(f"  {count} WOFF2 files")


# ---------------------------------------------------------------- coverage

def varint(n: int) -> bytes:
    out = bytearray()
    while True:
        byte = n & 0x7F
        n >>= 7
        if n:
            out.append(byte | 0x80)
        else:
            out.append(byte)
            return bytes(out)


def runs(cps: set[int]) -> bytes:
    """Alternating run lengths, starting with an absent run at U+0000."""
    out = bytearray()
    ordered = sorted(cps)
    position = 0
    i = 0
    while i < len(ordered):
        start = ordered[i]
        end = start
        while i + 1 < len(ordered) and ordered[i + 1] == end + 1:
            i += 1
            end += 1
        out += varint(start - position)
        out += varint(end - start + 1)
        position = end + 1
        i += 1
    return bytes(out)


def write_coverage(name: str, entries: dict[str, set[int]]) -> None:
    """`MDCV`, version, entry count; then per entry a tag, a length and runs."""
    blob = bytearray(b"MDCV") + bytes([1, len(entries)])
    for tag, cps in entries.items():
        payload = runs(cps)
        blob += bytes([len(tag)]) + tag.encode() + len(payload).to_bytes(4, "little") + payload
    (OUT / name).write_bytes(bytes(blob))
    print(f"  {name}: {', '.join(f'{t}={len(c)}' for t, c in entries.items())}; {len(blob)} bytes")


def cmap(path: Path) -> set[int]:
    from fontTools.ttLib import TTFont
    return set(TTFont(path, lazy=True).getBestCmap())


def build_coverage() -> None:
    write_coverage("coverage-scripts.bin", {
        "latin": cmap(OUT / "NotoSans-Regular.ttf"),
        **{key: cmap(OUT / f"{stem}-Regular.ttf") - cmap(OUT / "NotoSans-Regular.ttf")
           for key, stem in SCRIPTS.items()},
    })
    entries: dict[str, set[int]] = {}
    for key, stem in CJK.items():
        entries[f"{key}-subset"] = cmap(OUT / f"{stem}-Regular.subset.otf")
        entries[f"{key}-full"] = cmap(OUT / f"{stem}-Regular.full.otf")
    # Characters only one of the two Chinese standards has, among the common
    # ones: a document that uses more of the traditional-only set is Traditional.
    gb1, big1 = gb2312_level1(), big5_level1()
    entries["hans-only"] = gb1 - big1
    entries["hant-only"] = big1 - gb1
    write_coverage("coverage-cjk.bin", entries)


def report() -> None:
    import brotli
    print("\n| File | Raw | Brotli |\n| --- | ---: | ---: |")
    for path in sorted(OUT.iterdir()):
        if path.suffix in {".ttf", ".otf", ".woff2", ".bin"}:
            data = path.read_bytes()
            print(f"| `{path.name}` | {len(data) / 1e6:.2f} MB | {len(brotli.compress(data, quality=11)) / 1e6:.2f} MB |")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[1:]) or {"latin", "scripts", "cjk", "serif", "math", "coverage"}
    if "latin" in only:
        print("Latin faces:"); build_latin()
    if "scripts" in only:
        print("Script faces:"); build_scripts()
    if "cjk" in only:
        print("CJK faces:"); build_cjk()
    if "math" in only:
        print("Maths face:"); build_math()
    if "serif" in only:
        print("Serif faces:"); build_serif()
    if "latin" in only or "scripts" in only or "woff2" in only:
        print("WOFF2:"); build_woff2()
    if "coverage" in only:
        print("Coverage:"); build_coverage()
    for stale in ["subset-coverage.bin", "NotoSansSC-Regular.subset.ttf", "NotoSansSC-Bold.subset.ttf",
                  "NotoSansSC-Regular.full.ttf", "NotoSansSC-Bold.full.ttf"]:
        (OUT / stale).unlink(missing_ok=True)
    report()
    shutil.rmtree(WORK, ignore_errors=True)
    print("done")
