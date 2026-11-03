#!/usr/bin/env bash
# Encodes The Pull Request Post's tour from capture.mjs's frames: a silent
# looping video (VP9 WebM, H.264 MP4 fallback; -an, no audio track at all) and
# its poster (the first frame), into public/projects/.
#   scripts/pr-post-tour/build.sh <framesDir>
set -euo pipefail
FRAMES=$(cd "$1" && pwd)
OUT=$(cd "$(dirname "$0")/../../public/projects" && pwd)
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
ffmpeg -loglevel error -y -framerate 24 -i "$FRAMES/%04d.png" -an -vf format=yuv420p -c:v libx264 -preset veryslow -crf 28 \
  -profile:v high -movflags +faststart "$OUT/pr-post-tour.mp4"
for pass in 1 2; do
  target=/dev/null; [ $pass = 2 ] && target="$OUT/pr-post-tour.webm"
  ffmpeg -loglevel error -y -framerate 24 -i "$FRAMES/%04d.png" -an -vf format=yuv420p -c:v libvpx-vp9 -crf 42 -b:v 0 -row-mt 1 \
    -deadline good -cpu-used 1 -pass $pass -passlogfile "$work/vp9" -f webm "$target"
done
ffmpeg -loglevel error -y -i "$FRAMES/0000.png" -c:v libwebp -quality 82 "$OUT/pr-post-tour-poster.webp"
ls -la "$OUT"/pr-post-tour*
