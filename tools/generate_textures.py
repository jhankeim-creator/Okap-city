#!/usr/bin/env python3
"""Teksti orijinal pou kay Karayib, wout, twati ak dlo."""
from __future__ import annotations

import math
import os
import random
import struct
import zlib

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "textures")
os.makedirs(OUT, exist_ok=True)


def png(path: str, w: int, h: int, rgba: list[int]) -> None:
    raw = b"".join(b"\x00" + bytes(rgba[y * w * 4 : (y + 1) * w * 4]) for y in range(h))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    data = b"\x89PNG\r\n\x1a\n"
    data += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    data += chunk(b"IDAT", zlib.compress(raw, 9))
    data += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(data)


def fill(w: int, h: int, fn) -> list[int]:
    px = [0] * (w * h * 4)
    for y in range(h):
        for x in range(w):
            r, g, b = fn(x, y, w, h)
            i = (y * w + x) * 4
            px[i : i + 4] = [r, g, b, 255]
    return px


def clamp(v: int) -> int:
    return max(0, min(255, v))


def main() -> None:
    random.seed(21)

    def stucco(x, y, w, h):
        n = (math.sin(x * 0.35) + math.cos(y * 0.28)) * 8
        return clamp(214 + int(n)), clamp(196 + int(n * 0.6)), clamp(168 + int(n * 0.4))

    def roof(x, y, w, h):
        tile = 10
        band = (y // tile) % 2
        grout = 1 if y % tile < 1 or x % 18 < 1 else 0
        base = (176 - band * 18, 78 - band * 8, 42)
        if grout:
            return 120, 58, 32
        j = (x + y) % 7
        return clamp(base[0] + j), clamp(base[1] + j // 2), clamp(base[2])

    def asphalt(x, y, w, h):
        n = ((x * 13 + y * 7) % 9) - 4
        return clamp(48 + n), clamp(50 + n), clamp(54 + n)

    def grass(x, y, w, h):
        n = int(8 * math.sin(x * 0.4 + y * 0.2))
        return clamp(70 + n), clamp(110 + n), clamp(52 + n // 2)

    def sand(x, y, w, h):
        n = ((x + y * 3) % 11) - 5
        return clamp(222 + n), clamp(196 + n), clamp(120 + n)

    def wood(x, y, w, h):
        n = int(12 * math.sin(y * 0.6))
        return clamp(118 + n), clamp(78 + n // 2), clamp(42)

    png(os.path.join(OUT, "stucco.png"), 128, 128, fill(128, 128, stucco))
    png(os.path.join(OUT, "roof.png"), 128, 128, fill(128, 128, roof))
    png(os.path.join(OUT, "asphalt.png"), 128, 128, fill(128, 128, asphalt))
    png(os.path.join(OUT, "grass.png"), 128, 128, fill(128, 128, grass))
    png(os.path.join(OUT, "sand.png"), 128, 128, fill(128, 128, sand))
    png(os.path.join(OUT, "wood.png"), 64, 64, fill(64, 64, wood))
    print("textures pare")


if __name__ == "__main__":
    main()
