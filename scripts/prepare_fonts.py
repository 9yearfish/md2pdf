#!/usr/bin/env python3
"""Regenerate everything under public/fonts/.

The font binaries are committed so that neither the build nor the deploy needs
network access or Python. This script exists to document their provenance and
to make them reproducible.

    pip install fonttools brotli
    npm install --no-save @expo-google-fonts/noto-sans @expo-google-fonts/noto-sans-sc
    python3 scripts/prepare_fonts.py

Noto Sans and Noto Sans SC are the same type family, so Latin and Chinese share
weights and proportions instead of clashing. The Latin faces are subset to the
scripts and symbols a Markdown document realistically uses; Chinese ships twice,
as a GB2312-sized subset for the common case and as the full face for the rare
characters the subset lacks.
"""
from __future__ import annotations

import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "fonts"
NPM = ROOT / "node_modules" / "@expo-google-fonts"
TYPST_ASSETS = "https://raw.githubusercontent.com/typst/typst-assets/v0.13.1/files/fonts"

# Latin, Greek, Cyrillic, punctuation, currency, arrows, maths operators, box
# drawing, geometric shapes and ligatures.
LATIN_RANGES = ",".join([
    "U+0020-024F", "U+0300-036F", "U+0370-03FF", "U+0400-04FF",
    "U+2000-206F", "U+20A0-20BF", "U+2100-214F", "U+2190-21FF",
    "U+2200-22FF", "U+2500-257F", "U+25A0-25FF", "U+2600-26FF",
    "U+FB00-FB06",
])

LATIN_FACES = [
    ("NotoSans-Regular.ttf", "noto-sans/400Regular/NotoSans_400Regular.ttf"),
    ("NotoSans-Bold.ttf", "noto-sans/700Bold/NotoSans_700Bold.ttf"),
    ("NotoSans-Italic.ttf", "noto-sans/400Regular_Italic/NotoSans_400Regular_Italic.ttf"),
    ("NotoSans-BoldItalic.ttf", "noto-sans/700Bold_Italic/NotoSans_700Bold_Italic.ttf"),
]

CJK_FACES = [
    ("Regular", "noto-sans-sc/400Regular/NotoSansSC_400Regular.ttf"),
    ("Bold", "noto-sans-sc/700Bold/NotoSansSC_700Bold.ttf"),
]


def subset(source: Path, target: Path, *, unicodes: str = "", unicodes_file: Path | None = None) -> None:
    args = [
        "pyftsubset", str(source),
        f"--output-file={target}",
        "--layout-features=*", "--no-hinting", "--desubroutinize",
    ]
    args.append(f"--unicodes-file={unicodes_file}" if unicodes_file else f"--unicodes={unicodes}")
    subprocess.run(args, check=True)


def require(path: Path, package: str) -> Path:
    if not path.exists():
        sys.exit(f"missing {path}\n  npm install --no-save @expo-google-fonts/{package}")
    return path


def build_latin() -> None:
    for name, rel in LATIN_FACES:
        print(f"  subset {name}")
        subset(require(NPM / rel, "noto-sans"), OUT / name, unicodes=LATIN_RANGES)

    mono = OUT / "DejaVuSansMono.ttf"
    if not mono.exists():
        print("  fetch DejaVuSansMono.ttf")
        with urllib.request.urlopen(f"{TYPST_ASSETS}/DejaVuSansMono.ttf", timeout=120) as r:
            raw = OUT / ".DejaVuSansMono.orig.ttf"
            raw.write_bytes(r.read())
        subset(raw, mono, unicodes=LATIN_RANGES)
        raw.unlink()


def gb2312_codepoints() -> set[int]:
    """GB2312 hanzi plus the punctuation and Latin ranges Chinese text uses."""
    cps: set[int] = set(range(0x20, 0x7F)) | set(range(0xA0, 0x180))
    cps |= set(range(0x2000, 0x2070))  # general punctuation
    cps |= set(range(0x3000, 0x3030))  # CJK punctuation
    cps |= set(range(0xFF00, 0xFF61))  # fullwidth forms
    cps |= {0x00B7, 0x00D7, 0x2014, 0x2026}
    for hi in range(0xA1, 0xFF):
        for lo in range(0xA1, 0xFF):
            try:
                cps.add(ord(bytes([hi, lo]).decode("gb2312")))
            except UnicodeDecodeError:
                pass
    return cps


def build_cjk() -> None:
    cps = gb2312_codepoints()
    print(f"  subset target: {len(cps)} codepoints")
    listing = OUT / ".subset-unicodes.txt"
    listing.write_text(",".join(f"U+{c:04X}" for c in sorted(cps)))
    for weight, rel in CJK_FACES:
        source = require(NPM / rel, "noto-sans-sc")
        (OUT / f"NotoSansSC-{weight}.full.ttf").write_bytes(source.read_bytes())
        print(f"  subset NotoSansSC-{weight}")
        subset(source, OUT / f"NotoSansSC-{weight}.subset.ttf", unicodes_file=listing)
    listing.unlink()


def build_coverage() -> None:
    """A BMP bitmap of the subset's cmap.

    Lets the app choose between the subset and the full face without
    downloading either one first.
    """
    from fontTools.ttLib import TTFont

    bits = bytearray(0x10000 // 8)
    covered = 0
    for cp in TTFont(OUT / "NotoSansSC-Regular.subset.ttf", lazy=True).getBestCmap():
        if cp <= 0xFFFF:
            bits[cp >> 3] |= 1 << (cp & 7)
            covered += 1
    (OUT / "subset-coverage.bin").write_bytes(bytes(bits))
    print(f"  coverage bitmap: {covered} codepoints, {len(bits)} bytes")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    print("Latin faces:"); build_latin()
    print("CJK faces:"); build_cjk()
    print("Coverage:"); build_coverage()
    print("done")
