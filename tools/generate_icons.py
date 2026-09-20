#!/usr/bin/env python3
"""Kreye logo / ikòn orijinal OKAP CITY (PNG + Android adaptive)."""
from __future__ import annotations

import math
import os
import struct
import zlib

ROOT = os.path.join(os.path.dirname(__file__), "..")
PUBLIC = os.path.join(ROOT, "public", "icons")
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")
os.makedirs(PUBLIC, exist_ok=True)


def png(path: str, w: int, h: int, rgba) -> None:
    raw = b"".join(b"\x00" + bytes(rgba[y * w * 4 : (y + 1) * w * 4]) for y in range(h))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    data = b"\x89PNG\r\n\x1a\n"
    data += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    data += chunk(b"IDAT", zlib.compress(raw, 9))
    data += chunk(b"IEND", b"")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)


def paint(size: int, pad: bool = False) -> list[int]:
    px = [0] * (size * size * 4)
    cx = cy = size / 2

    def setp(x: int, y: int, r, g, b, a=255):
        if 0 <= x < size and 0 <= y < size:
            i = (y * size + x) * 4
            px[i : i + 4] = [r, g, b, a]

    bg = (7, 17, 31)
    gold = (212, 160, 23)
    for y in range(size):
        for x in range(size):
            dx, dy = x - cx, y - cy
            d = math.hypot(dx, dy) / (size * 0.48)
            if pad and d > 1:
                setp(x, y, 0, 0, 0, 0)
                continue
            shade = 18 + int(20 * (1 - d))
            setp(x, y, bg[0] + shade, bg[1] + shade, bg[2] + shade)
            if 0.78 < d < 0.92:
                setp(x, y, *gold)
            # mòn / solèy senbol
            if dy > size * 0.08 and abs(dx) < size * 0.28 - (dy - size * 0.08) * 0.7:
                setp(x, y, 45, 90, 70)
            if math.hypot(dx, dy + size * 0.16) < size * 0.12:
                setp(x, y, *gold)
    # lèt OC
    s = max(1, size // 64)
    for y in range(size):
        for x in range(size):
            nx = (x - cx) / size
            ny = (y - cy) / size + 0.18
            ring = abs(math.hypot(nx + 0.12, ny) - 0.11)
            bar = abs(nx - 0.12) < 0.035 and -0.12 < ny < 0.12
            if ring < 0.03 or bar:
                setp(x, y, 246, 243, 234)
    return px


def main() -> None:
    for size, name in ((192, "icon-192.png"), (512, "icon-512.png"), (1024, "icon-1024.png")):
        png(os.path.join(PUBLIC, name), size, size, paint(size))
    for size, folder in ((48, "mipmap-mdpi"), (72, "mipmap-hdpi"), (96, "mipmap-xhdpi"), (144, "mipmap-xxhdpi"), (192, "mipmap-xxxhdpi")):
        png(os.path.join(RES, folder, "ic_launcher.png"), size, size, paint(size))
        png(os.path.join(RES, folder, "ic_launcher_round.png"), size, size, paint(size))
        png(os.path.join(RES, folder, "ic_launcher_foreground.png"), size, size, paint(size, pad=True))
    print("ikòn OKAP CITY pare.")


if __name__ == "__main__":
    main()
