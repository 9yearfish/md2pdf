#!/usr/bin/env python3
"""Regenerate everything under public/fonts/.

The font binaries are committed so that neither the build nor the deploy needs
network access or Python. This script exists to document their provenance and
to make them reproducible.

    pip install fonttools brotli
    npm install --no-save @expo-google-fonts/noto-sans-sc@0.4.3
    python3 scripts/prepare_fonts.py

Latin faces come from the Typst asset repositories (OFL). The CJK face is Noto
Sans SC (OFL), shipped twice: a GB2312-sized subset for the common case and the
full face as an automatic fallback for rare characters.
"""
from __future__ import annotations

import subprocess
import sys
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "fonts"
TYPST_ASSETS = "https://raw.githubusercontent.com/typst/typst-assets/v0.13.1/files/fonts"
NOTO_NPM = Path("node_modules/@expo-google-fonts/noto-sans-sc")

LATIN = [
    "LibertinusSerif-Regular.otf",
    "LibertinusSerif-Bold.otf",
    "LibertinusSerif-Italic.otf",
    "DejaVuSansMono.ttf",
]


def fetch_latin() -> None:
    for name in LATIN:
        target = OUT / name
        if target.exists():
            print(f"  have {name}")
            continue
        print(f"  fetch {name}")
        with urllib.request.urlopen(f"{TYPST_ASSETS}/{name}", timeout=120) as r:
            target.write_bytes(r.read())


def subset_codepoints() -> set[int]:
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
    if not NOTO_NPM.exists():
        sys.exit(
            "Noto Sans SC not found. Run:\n"
            "  npm install --no-save @expo-google-fonts/noto-sans-sc@0.4.3"
        )
    cps = subset_codepoints()
    print(f"  subset target: {len(cps)} codepoints")
    unicodes = OUT.parent / ".subset-unicodes.txt"
    unicodes.write_text(",".join(f"U+{c:04X}" for c in sorted(cps)))

    for weight, src in (("Regular", "400Regular/NotoSansSC_400Regular.ttf"),
                        ("Bold", "700Bold/NotoSansSC_700Bold.ttf")):
        source = NOTO_NPM / src
        (OUT / f"NotoSansSC-{weight}.full.ttf").write_bytes(source.read_bytes())
        print(f"  subset NotoSansSC-{weight}")
        subprocess.run(
            [
                "pyftsubset", str(source),
                f"--unicodes-file={unicodes}",
                f"--output-file={OUT / f'NotoSansSC-{weight}.subset.ttf'}",
                "--layout-features=*", "--no-hinting", "--desubroutinize",
            ],
            check=True,
        )
    unicodes.unlink()


def build_coverage() -> None:
    """A BMP bitmap of the subset's cmap.

    Lets the app decide between the subset and the full face without
    downloading either one first.
    """
    from fontTools.ttLib import TTFont

    font = TTFont(OUT / "NotoSansSC-Regular.subset.ttf", lazy=True)
    bits = bytearray(0x10000 // 8)
    covered = 0
    for cp in font.getBestCmap():
        if cp <= 0xFFFF:
            bits[cp >> 3] |= 1 << (cp & 7)
            covered += 1
    (OUT / "subset-coverage.bin").write_bytes(bytes(bits))
    print(f"  coverage bitmap: {covered} codepoints, {len(bits)} bytes")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    print("Latin faces:"); fetch_latin()
    print("CJK faces:"); build_cjk()
    print("Coverage:"); build_coverage()
    print("done")
