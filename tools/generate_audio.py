#!/usr/bin/env python3
"""Jenere mizik ak son orijinal pou OKAP CITY (pa gen echantiyon copyright)."""
from __future__ import annotations

import math
import os
import random
import struct
import wave

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
os.makedirs(OUT, exist_ok=True)
SR = 22050


def write_wav(name: str, samples: list[float]) -> None:
    path = os.path.join(OUT, name)
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = b"".join(struct.pack("<h", max(-32767, min(32767, int(s * 32767)))) for s in samples)
        w.writeframes(frames)
    print("wrote", path)


def env(i: int, n: int, a=0.02, r=0.15) -> float:
    t = i / n
    if t < a:
        return t / a
    if t > 1 - r:
        return max(0.0, (1 - t) / r)
    return 1.0


def tone(freq: float, t: float) -> float:
    return math.sin(2 * math.pi * freq * t)


def steel(freq: float, t: float) -> float:
    return (
        0.55 * tone(freq, t)
        + 0.22 * tone(freq * 2.01, t)
        + 0.12 * tone(freq * 2.99, t)
        + 0.08 * math.sin(2 * math.pi * freq * 0.5 * t)
    ) * math.exp(-t * 1.8)


def percussion(t: float, kind: str) -> float:
    if kind == "kick":
        return math.sin(2 * math.pi * (90 - t * 40) * t) * math.exp(-t * 12)
    if kind == "snare":
        return (random.random() * 2 - 1) * math.exp(-t * 16)
    if kind == "clave":
        return math.sin(2 * math.pi * 1900 * t) * math.exp(-t * 40)
    return (random.random() * 2 - 1) * math.exp(-t * 8) * 0.4


def song(seconds: float, bpm: int, roots: list[float], energy: float) -> list[float]:
    n = int(seconds * SR)
    out = [0.0] * n
    beat = 60 / bpm
    scale = [0, 2, 4, 7, 9, 11, 12]
    for i in range(n):
        t = i / SR
        measure = t / (beat * 4)
        root = roots[int(measure) % len(roots)]
        step = scale[int(t / beat) % len(scale)]
        freq = root * (2 ** (step / 12))
        pad = 0.12 * energy * math.sin(2 * math.pi * root * 0.5 * t) * (0.6 + 0.4 * math.sin(t * 0.7))
        lead = 0.22 * energy * steel(freq, t % (beat * 2))
        bass = 0.16 * energy * tone(root / 2, t) * (0.5 + 0.5 * math.sin(t * 1.3))
        bt = t % beat
        perc = 0.0
        if bt < 0.08:
            perc += 0.28 * percussion(bt, "kick")
        if 0.48 < (t % (beat * 2)) < 0.56:
            perc += 0.18 * percussion((t % (beat * 2)) - 0.48, "snare")
        if abs((t % (beat * 0.5)) ) < 0.03:
            perc += 0.1 * percussion(t % (beat * 0.5), "clave")
        out[i] = max(-1, min(1, (pad + lead + bass + perc) * env(i, n, 0.04, 0.12)))
    return out


def sfx_noise(seconds: float, decay: float, tone_hz: float | None = None) -> list[float]:
    n = int(seconds * SR)
    out = []
    for i in range(n):
        t = i / SR
        s = (random.random() * 2 - 1) * math.exp(-t * decay)
        if tone_hz:
            s += 0.4 * math.sin(2 * math.pi * tone_hz * t) * math.exp(-t * decay * 0.7)
        out.append(max(-1, min(1, s)))
    return out


def main() -> None:
    random.seed(84)
    write_wav("menu.wav", song(12, 98, [196, 220, 174, 246], 0.85))
    write_wav("battle.wav", song(10, 128, [220, 246, 196, 261], 1.05))
    write_wav("final.wav", song(8, 148, [246, 277, 220, 329], 1.2))
    write_wav("victory.wav", song(6, 118, [261, 329, 392, 440], 1.0))
    write_wav("defeat.wav", song(6, 72, [174, 164, 146, 130], 0.7))
    write_wav("ambient.wav", song(10, 70, [130, 146, 164, 174], 0.35))
    write_wav("shoot.wav", sfx_noise(0.22, 26, 180))
    write_wav("reload.wav", sfx_noise(0.35, 9, 420))
    write_wav("hit.wav", sfx_noise(0.16, 20, 240))
    write_wav("explode.wav", sfx_noise(0.55, 7, 70))
    write_wav("pickup.wav", sfx_noise(0.2, 10, 880))
    write_wav("engine.wav", sfx_noise(0.8, 2.2, 90))
    print("OKAP CITY audio orijinal pare.")


if __name__ == "__main__":
    main()
