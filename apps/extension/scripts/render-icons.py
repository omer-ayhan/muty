#!/usr/bin/env python3
"""Draw the Muty toolbar icons with the standard library."""

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src" / "icons"


def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def inside_round_rect(x, y, size, margin, radius):
    if x < margin or y < margin or x >= size - margin or y >= size - margin:
        return False
    left = margin + radius
    right = size - margin - radius
    top = margin + radius
    bottom = size - margin - radius
    if left <= x <= right or top <= y <= bottom:
        return True
    corner_x = left if x < left else right
    corner_y = top if y < top else bottom
    dx = x - corner_x
    dy = y - corner_y
    return dx * dx + dy * dy <= radius * radius


def color_at(x, y, size):
    margin = size * 0.06
    radius = size * 0.22
    if not inside_round_rect(x, y, size, margin, radius):
        return (0, 0, 0, 0)
    if size * 0.42 <= y <= size * 0.58 and size * 0.18 <= x <= size * 0.82:
        return (231, 160, 74, 255)
    if size * 0.26 <= y <= size * 0.33 and size * 0.22 <= x <= size * 0.78:
        return (63, 56, 50, 255)
    if size * 0.67 <= y <= size * 0.74 and size * 0.22 <= x <= size * 0.78:
        return (63, 56, 50, 255)
    return (28, 25, 21, 255)


def sample(px, py, size):
    steps = 4
    totals = [0, 0, 0, 0]
    for sy in range(steps):
        for sx in range(steps):
            red, green, blue, alpha = color_at(px + (sx + 0.5) / steps, py + (sy + 0.5) / steps, size)
            totals[0] += red * alpha
            totals[1] += green * alpha
            totals[2] += blue * alpha
            totals[3] += alpha
    if totals[3] == 0:
        return (0, 0, 0, 0)
    count = totals[3]
    return (
        round(totals[0] / count),
        round(totals[1] / count),
        round(totals[2] / count),
        round(count / (steps * steps)),
    )


def png(size):
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            raw.extend(sample(x, y, size))
    header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    compressed = zlib.compress(bytes(raw), 9)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    for size in (16, 32, 48, 128):
        (ROOT / f"icon{size}.png").write_bytes(png(size))


if __name__ == "__main__":
    main()
