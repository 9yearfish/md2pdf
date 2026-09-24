"""Every icon and logo size, from the one source image brand/logo.png (960 px).

    npm run icons

Writes to public/: favicon.ico (16/32/48), favicon-32.png, logo-48.png and
logo-96.png (the 24 px wordmark icon at 1x/2x), apple-touch-icon.png (180),
icon-192.png and icon-512.png (web manifest). scripts/og.mjs embeds
logo-96.png in the share images.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "brand" / "logo.png"
PUBLIC = ROOT / "public"

logo = Image.open(SOURCE).convert("RGBA")

def sized(px: int) -> Image.Image:
    return logo.resize((px, px), Image.LANCZOS)

for name, px in [("favicon-32.png", 32), ("logo-48.png", 48), ("logo-96.png", 96),
                 ("icon-192.png", 192), ("icon-512.png", 512)]:
    sized(px).save(PUBLIC / name, optimize=True)

# The iOS home-screen icon is drawn by the system with its own rounded mask,
# so it gets an opaque square: the logo's own corners over its dark ground.
touch = Image.new("RGBA", (180, 180), (30, 30, 30, 255))
touch.alpha_composite(sized(180))
touch.convert("RGB").save(PUBLIC / "apple-touch-icon.png", optimize=True)

sized(48).save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("icons written:", ", ".join(sorted(p.name for p in PUBLIC.glob("*") if p.suffix in {".png", ".ico"} and not p.name.startswith("og"))))
