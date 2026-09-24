"""Every icon and logo size.

Two sources: the app icon brand/logo.png (960 px) for the home-screen and
PWA icons, where its detail survives; and a small mark drawn here, a white
"Free" on Adobe red, for the favicon and the 24 px logo in the page, where
the app icon's small "md pdf" lettering is unreadable.

    npm run icons

Writes to public/: favicon.ico (16/32/48), favicon-32.png, logo-48.png and
logo-96.png (the 24 px wordmark icon at 1x/2x), apple-touch-icon.png (180),
icon-192.png and icon-512.png (web manifest). scripts/og.mjs embeds
logo-96.png in the share images.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "brand" / "logo.png"
PUBLIC = ROOT / "public"

logo = Image.open(SOURCE).convert("RGBA")

RED = (250, 15, 0, 255)  # Adobe's PDF red, as in the wordmark
FONT = ROOT / "public" / "fonts" / "NotoSans-Bold.ttf"


def mark(px: int) -> Image.Image:
    """White "Free" on a red rounded square, drawn large and scaled down."""
    big = 1024
    image = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((0, 0, big - 1, big - 1), radius=int(big * 0.22), fill=RED)
    # The largest size at which "Free" fits the square with a margin.
    size = big
    while True:
        font = ImageFont.truetype(str(FONT), size)
        left, top, right, bottom = draw.textbbox((0, 0), "Free", font=font)
        if right - left <= big * 0.80:
            break
        size -= 8
    x = (big - (right - left)) / 2 - left
    y = (big - (bottom - top)) / 2 - top
    draw.text((x, y), "Free", font=font, fill=(255, 255, 255, 255))
    return image.resize((px, px), Image.LANCZOS)


def sized(px: int) -> Image.Image:
    return logo.resize((px, px), Image.LANCZOS)

for name, px in [("favicon-32.png", 32), ("logo-48.png", 48), ("logo-96.png", 96)]:
    mark(px).save(PUBLIC / name, optimize=True)
for name, px in [("icon-192.png", 192), ("icon-512.png", 512)]:
    sized(px).save(PUBLIC / name, optimize=True)

# The iOS home-screen icon is drawn by the system with its own rounded mask,
# so it gets an opaque square: the logo's own corners over its dark ground.
touch = Image.new("RGBA", (180, 180), (30, 30, 30, 255))
touch.alpha_composite(sized(180))
touch.convert("RGB").save(PUBLIC / "apple-touch-icon.png", optimize=True)

mark(48).save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
mark(512).save(ROOT / "brand" / "mark.png", optimize=True)
print("icons written:", ", ".join(sorted(p.name for p in PUBLIC.glob("*") if p.suffix in {".png", ".ico"} and not p.name.startswith("og"))))
