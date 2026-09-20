#!/usr/bin/env python3
"""Koupe HUD nan foto konsèp yo pou mete yo nan mond 3D la."""
from __future__ import annotations

import os

from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "public")
SRC = os.path.join(ROOT, "concept")
PLATES = os.path.join(ROOT, "textures", "plates")
PORTRAITS = os.path.join(ROOT, "textures", "portraits")
os.makedirs(PLATES, exist_ok=True)
os.makedirs(PORTRAITS, exist_ok=True)


def save(im: Image.Image, name: str, folder: str = PLATES) -> None:
    path = os.path.join(folder, name)
    im.convert("RGB").save(path, "PNG", optimize=True)
    print(name, im.size)


def main() -> None:
    city = Image.open(os.path.join(SRC, "city.png"))
    combat = Image.open(os.path.join(SRC, "combat.png"))
    explore = Image.open(os.path.join(SRC, "explore.png"))
    drive = Image.open(os.path.join(SRC, "drive.png"))
    roster = Image.open(os.path.join(SRC, "roster.png"))

    # 1672x941: retire kadran HUD epi kenbe kay / vil la.
    save(city.crop((250, 88, 1410, 690)), "city-horizon.png")
    save(combat.crop((220, 70, 780, 400)), "harbor-hills.png")
    save(explore.crop((190, 55, 620, 390)), "harbor-bay.png")
    save(combat.crop((820, 68, 1360, 470)), "house-blue.png")
    save(explore.crop((640, 32, 1260, 470)), "house-cream.png")

    # 1536x1024: peyizaj solèy kouche san kadran.
    save(drive.crop((280, 95, 1260, 500)), "coast-sunset.png")
    save(drive.crop((500, 360, 1050, 880)), "suv-rear.png")

    names = ["junior", "david", "kendy", "mika", "vanessa", "sarah", "naomi", "ruth"]
    left, top, col_w, row_h, gap_x, gap_y = 18, 18, 262, 470, 8, 18
    for i, name in enumerate(names):
        c, r = i % 4, i // 4
        x0 = left + c * (col_w + gap_x)
        y0 = top + r * (row_h + gap_y)
        face = roster.crop((x0, y0, x0 + col_w, y0 + 248))
        save(face, f"{name}.png", PORTRAITS)

    print("plates pare")


if __name__ == "__main__":
    main()
