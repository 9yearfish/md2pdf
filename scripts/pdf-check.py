#!/usr/bin/env python3
"""Inspect a PDF for scripts-render.mjs: its text, its fonts, and any .notdef.

    python3 scripts/pdf-check.py file.pdf

Prints JSON: {"text": ..., "fonts": [...], "notdef": [...], "images": n,
"outside": [...], "pages": [...], "fills": [...], "strokes": [...], "backend": ...}.
"pages" has, per page, its size, text, fonts, and the text in the top and
bottom margins (header and footer), for scripts/pages.mjs.

`notdef` lists the characters drawn with glyph 0, i.e. tofu, which text
extraction alone cannot see: the PDF's ToUnicode map still says what the
character was meant to be. `images` counts raster images (diagrams must be
vectors), `outside` lists anything drawn or written past the page's edge (a
diagram that did not fit) and `fills`/`strokes` are the colours used; these
need PyMuPDF and are missing otherwise. Uses
PyMuPDF when it is installed, else pypdf, else poppler's pdftotext/pdffonts
(text and fonts only).
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys


def with_pymupdf(path: str) -> dict:
    import fitz  # PyMuPDF

    doc = fitz.open(path)
    text, fonts, notdef, outside, images = [], set(), [], [], 0
    fills, strokes = set(), set()
    for number, page in enumerate(doc, 1):
        text.append(page.get_text())
        images += len(page.get_images(full=True))
        edge = page.rect + (-0.5, -0.5, 0.5, 0.5)
        boxes = [("drawing", d["rect"]) for d in page.get_drawings()]
        boxes += [("text", fitz.Rect(b["bbox"])) for b in page.get_text("dict")["blocks"]]
        for d in page.get_drawings():
            for key, found in (("fill", fills), ("color", strokes)):
                if d.get(key):
                    found.add("#%02x%02x%02x" % tuple(round(c * 255) for c in d[key][:3]))
        for kind, box in boxes:
            if not box.is_empty and not edge.contains(box):
                outside.append(f"page {number}: {kind} at {tuple(round(v) for v in box)}")
        for font in page.get_fonts(full=True):
            fonts.add(font[3])
        for span in page.get_texttrace():
            for char in span["chars"]:
                if char[1] == 0 and char[0] not in (0x20, 0xA0):
                    notdef.append(chr(char[0]) if char[0] > 0 else "?")
    pages = []
    for page in doc:
        rect = page.rect
        # The header and footer bands: text in the top and bottom margins.
        top = fitz.Rect(rect.x0, rect.y0, rect.x1, rect.y0 + rect.height * 0.09)
        bottom = fitz.Rect(rect.x0, rect.y1 - rect.height * 0.08, rect.x1, rect.y1)
        pages.append({
            "width": round(rect.width, 1),
            "height": round(rect.height, 1),
            "text": page.get_text(),
            "top": page.get_text(clip=top).strip(),
            "bottom": page.get_text(clip=bottom).strip(),
            "fonts": sorted({f[3] for f in page.get_fonts(full=True)}),
        })
    return {
        "text": "\n".join(text),
        "fonts": sorted(fonts),
        "notdef": notdef,
        "images": images,
        "outside": outside,
        "pages": pages,
        "fills": sorted(fills),
        "strokes": sorted(strokes),
        "backend": "pymupdf",
    }


def with_pypdf(path: str) -> dict:
    from pypdf import PdfReader

    reader = PdfReader(path)
    fonts = set()
    for page in reader.pages:
        resources = page.get("/Resources") or {}
        for font in (resources.get("/Font") or {}).values():
            fonts.add(str(font.get_object().get("/BaseFont", "")).lstrip("/"))
        for xobject in (resources.get("/XObject") or {}).values():
            inner = (xobject.get_object().get("/Resources") or {}).get("/Font") or {}
            for font in inner.values():
                fonts.add(str(font.get_object().get("/BaseFont", "")).lstrip("/"))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    return {"text": text, "fonts": sorted(fonts), "notdef": None, "images": None, "outside": None, "pages": len(reader.pages), "backend": "pypdf"}


def with_poppler(path: str) -> dict:
    text = subprocess.run(["pdftotext", "-enc", "UTF-8", path, "-"], capture_output=True, text=True, check=True).stdout
    listing = subprocess.run(["pdffonts", path], capture_output=True, text=True, check=True).stdout
    fonts = [line.split()[0] for line in listing.splitlines()[2:] if line.strip()]
    return {"text": text, "fonts": sorted(set(fonts)), "notdef": None, "images": None, "outside": None, "pages": None, "backend": "poppler"}


def main() -> None:
    path = sys.argv[1]
    for backend in (with_pymupdf, with_pypdf):
        try:
            result = backend(path)
            break
        except ImportError:
            continue
    else:
        if not shutil.which("pdftotext"):
            sys.exit("need PyMuPDF, pypdf or poppler-utils to inspect PDFs")
        result = with_poppler(path)
    # Subset prefixes (ABCDEF+) and CID suffixes are noise for comparisons.
    result["fonts"] = sorted({re.sub(r"^[A-Z]{6}\+", "", f).replace("-Identity-H", "") for f in result["fonts"]})
    for page in result.get("pages", []):
        page["fonts"] = sorted({re.sub(r"^[A-Z]{6}\+", "", f).replace("-Identity-H", "") for f in page["fonts"]})
    json.dump(result, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
