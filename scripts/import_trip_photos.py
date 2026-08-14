from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageOps


SOURCE = Path.home() / "Desktop" / "cc地图"
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "trips"
COUNTRIES = {
    "悉尼": "sydney",
    "瓦努阿图": "vanuatu",
    "新西兰": "new-zealand",
    "日本": "japan",
    "清迈": "thailand",
    "泰国": "thailand",
    "香港": "hong-kong",
}
SUPPORTED = {".jpg", ".jpeg", ".png", ".webp"}


def main() -> None:
    if not SOURCE.is_dir():
        raise SystemExit(f"Source folder not found: {SOURCE}")

    manifest: dict[str, list[str]] = {slug: [] for slug in COUNTRIES.values()}
    OUTPUT.mkdir(parents=True, exist_ok=True)

    for chinese_name, slug in COUNTRIES.items():
        source_dir = SOURCE / chinese_name
        if not source_dir.is_dir():
            continue
        destination = OUTPUT / slug
        destination.mkdir(parents=True, exist_ok=True)

        photos = sorted(
            path for path in source_dir.iterdir()
            if path.is_file() and path.suffix.lower() in SUPPORTED
        )
        for index, source in enumerate(photos, start=1):
            filename = f"photo-{index:02d}.webp"
            target = destination / filename
            with Image.open(source) as opened:
                image = ImageOps.exif_transpose(opened).convert("RGB")
                image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
                image.save(target, "WEBP", quality=82, method=6)
            manifest[slug].append(f"/trips/{slug}/{filename}")

    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({key: len(value) for key, value in manifest.items()}, ensure_ascii=False))


if __name__ == "__main__":
    main()
