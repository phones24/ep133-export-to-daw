#!/usr/bin/env python3
"""Process EP133 device image: remove white background, trim, cover-scale to 74x100, and save.

- Reads source from .media/ep133-on.png
- Removes white background with tolerance
- Trims to content bounds
- Resizes with 'cover' semantics and center-crops/pads to exactly 74x100
- Saves to public/ep133-on.png
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import Tuple

from PIL import Image


def remove_white_background(img: Image.Image, tolerance: int = 15) -> Image.Image:
    """Remove near-white background by making those pixels transparent.

    A pixel is made transparent if all RGB channels are >= 255 - tolerance.

    Args:
        img: Input image (any mode); will be converted to RGBA.
        tolerance: 0-255 threshold for whiteness tolerance.

    Returns:
        Image in RGBA mode with white-ish pixels set to alpha=0.
    """
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    datas = img.getdata()
    limit = max(0, 255 - int(tolerance))

    new_data = []
    for r, g, b, a in datas:
        if r >= limit and g >= limit and b >= limit:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append((r, g, b, a))

    img.putdata(new_data)
    return img


def trim_to_content(img: Image.Image) -> Image.Image:
    """Trim transparent margins to the bounding box of non-transparent pixels."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    alpha = img.split()[3]
    bbox = alpha.getbbox()
    if bbox is None:
        # Entire image is transparent; return as-is
        return img
    return img.crop(bbox)


def resize_cover_center(img: Image.Image, target: Tuple[int, int]) -> Image.Image:
    """Resize image to cover target size and center-crop/pad to exact dimensions.

    Uses LANCZOS filter for high-quality resampling.
    """
    target_w, target_h = target
    src_w, src_h = img.width, img.height

    if src_w == 0 or src_h == 0:
        raise ValueError("Source image has zero dimension after trimming")

    scale = max(target_w / src_w, target_h / src_h)
    new_w = int(math.ceil(src_w * scale))
    new_h = int(math.ceil(src_h * scale))

    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Center-crop if larger; otherwise pad on transparent background
    if new_w >= target_w and new_h >= target_h:
        left = (new_w - target_w) // 2
        top = (new_h - target_h) // 2
        return resized.crop((left, top, left + target_w, top + target_h))

    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    offset_x = (target_w - new_w) // 2
    offset_y = (target_h - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)
    return canvas


def main() -> None:
    repo_root = Path(__file__).resolve().parent
    src_path = repo_root / ".media" / "ep133-on.png"
    out_path = repo_root / "public" / "ep133-on.png"

    if not src_path.exists():
        raise FileNotFoundError(f"Source image not found: {src_path}")

    img = Image.open(src_path)

    img = remove_white_background(img, tolerance=15)
    img = trim_to_content(img)
    img = resize_cover_center(img, (74, 100))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "PNG")

    print(f"Image saved to {out_path}")
    print(f"Size: {img.size}")


if __name__ == "__main__":
    main()
