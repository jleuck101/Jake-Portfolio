#!/usr/bin/env bash
set -euo pipefail

# Generates first-frame JPG thumbnails for videos/previews/*.mp4 into images/tools_thumbs/
# Custom override: if images/tools_thumbs_custom/<name>.jpg exists, it is copied instead.
# Skips work when thumbnail exists and is newer than the mp4 (unless forced).

FORCE=0
if [[ "${1:-}" == "--force" ]]; then
  FORCE=1
fi

PREVIEW_DIR="videos/previews"
OUT_DIR="images/tools_thumbs"
CUSTOM_DIR="images/tools_thumbs_custom"

mkdir -p "$OUT_DIR" "$CUSTOM_DIR"

shopt -s nullglob
mp4s=("$PREVIEW_DIR"/*.mp4)

if [[ ${#mp4s[@]} -eq 0 ]]; then
  echo "No mp4s found in $PREVIEW_DIR"
  exit 0
fi

for f in "${mp4s[@]}"; do
  base="$(basename "$f" .mp4)"
  out="$OUT_DIR/${base}.jpg"
  custom="$CUSTOM_DIR/${base}.jpg"

  # If a custom thumb exists, prefer it.
  if [[ -f "$custom" ]]; then
    if [[ $FORCE -eq 1 || ! -f "$out" || "$custom" -nt "$out" ]]; then
      cp -f "$custom" "$out"
      echo "Custom -> $out"
    else
      echo "Up-to-date (custom): $out"
    fi
    continue
  fi

  # Auto-generate only if missing or mp4 is newer or forced.
  if [[ $FORCE -eq 1 || ! -f "$out" || "$f" -nt "$out" ]]; then
    ffmpeg -y -loglevel error -i "$f" -vf "select=eq(n\,0),scale=640:-1" -frames:v 1 -q:v 3 "$out"
    echo "Generated -> $out"
  else
    echo "Up-to-date: $out"
  fi
done

echo "Done."
