#!/usr/bin/env bash
# Builds Scribe's app tour from the scenes capture.mjs took: a silent looping
# video (VP9 WebM, H.264 MP4 fallback; no audio track at all), its poster (the
# first frame) and stills of the app for its build page, into public/builds/scribe/.
# Each scene holds HOLD seconds and crossfades into the next over FADE; the last
# fades back into the first, so the loop has no seam.
#   scripts/scribe-tour/build.sh <scenesDir>
set -euo pipefail
SCENES=$(cd "$1" && pwd)
OUT=$(cd "$(dirname "$0")/../../public/builds/scribe" && pwd)
HOLD=${HOLD:-2.4} FADE=${FADE:-0.5} W=1280 H=800 FPS=24
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT

mapfile -t scenes < <(ls "$SCENES"/*.png | sort)
scenes+=("${scenes[0]}")
n=${#scenes[@]}
D=$(echo "$HOLD + $FADE" | bc)
inputs=(); for s in "${scenes[@]}"; do inputs+=(-loop 1 -framerate $FPS -t "$D" -i "$s"); done
fc=""
for i in $(seq 0 $((n - 1))); do fc+="[$i:v]scale=$W:$H:flags=lanczos,format=gbrp,setsar=1[s$i];"; done
prev=s0
for i in $(seq 1 $((n - 1))); do fc+="[$prev][s$i]xfade=transition=fade:duration=$FADE:offset=$(echo "$i * $HOLD" | bc)[x$i];"; prev=x$i; done
fc+="[$prev]trim=duration=$(echo "($n - 1) * $HOLD + $FADE" | bc),setpts=PTS-STARTPTS[v]"

# A lossless master, then each delivery format from it (-an: no audio stream).
ffmpeg -loglevel error -y "${inputs[@]}" -filter_complex "$fc" -map "[v]" -an -c:v libx264rgb -preset ultrafast -qp 0 "$work/master.mkv"
ffmpeg -loglevel error -y -i "$work/master.mkv" -an -vf format=yuv420p -c:v libx264 -preset veryslow -tune stillimage -crf 27 \
  -profile:v high -movflags +faststart "$OUT/tour.mp4"
for pass in 1 2; do
  target=/dev/null; [ $pass = 2 ] && target="$OUT/tour.webm"
  ffmpeg -loglevel error -y -i "$work/master.mkv" -an -vf format=yuv420p -c:v libvpx-vp9 -crf 44 -b:v 0 -row-mt 1 \
    -deadline good -cpu-used 1 -pass $pass -passlogfile "$work/vp9" -f webm "$target"
done

# The poster is the video's first frame; the stills are a few of the views.
still() { ffmpeg -loglevel error -y -i "$1" -vf scale=$W:$H:flags=lanczos -c:v libwebp -quality "${3:-86}" "$OUT/$2.webp"; }
still "${scenes[0]}" tour-poster 82
for name in home history models-language appearance-emerald; do still "$(ls "$SCENES"/*-"$name".png)" "app-$name"; done
ls -la "$OUT"
