#!/usr/bin/env bash
# Encodes a take from record.mjs into a build page's header clip: the kept
# segments joined, scaled to 960x600 at 24 fps, the last half second fading
# into the first frame so the loop has no seam, then a silent VP9 WebM, an
# H.264 MP4 fallback (no audio track at all) and a WebP poster (the take's
# last moment, the product doing its thing: what reduced motion shows), into
# public/builds/<slug>/clip.*. Keep each file under ~1.5 MB.
#   scripts/product-clips/encode.sh <slug> <take.webm> <start-end> [<start-end> ...]
# Segments are seconds into the take, e.g. 0.95-5.34 5.62-10.1, to cut the
# page loads out.
set -euo pipefail
slug=$1 take=$2; shift 2
OUT=$(cd "$(dirname "$0")/../../public/builds/$slug" && pwd)
W=960 H=600 FPS=24 SEAM=0.5
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT

i=0; list="$work/list.txt"; : > "$list"
for seg in "$@"; do
  from=${seg%-*} to=${seg#*-}
  ffmpeg -loglevel error -y -ss "$from" -to "$to" -i "$take" -an \
    -vf "fps=$FPS,scale=$W:$H:flags=lanczos,format=yuv420p,setsar=1" -c:v libx264 -preset ultrafast -qp 0 "$work/seg$i.mkv"
  echo "file $work/seg$i.mkv" >> "$list"; i=$((i + 1))
done
ffmpeg -loglevel error -y -f concat -safe 0 -i "$list" -c copy "$work/take.mkv"
ffmpeg -loglevel error -y -i "$work/take.mkv" -frames:v 1 "$work/first.png"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$work/take.mkv")
ffmpeg -loglevel error -y -i "$work/take.mkv" -loop 1 -framerate $FPS -t $SEAM -i "$work/first.png" -an -filter_complex \
  "[1:v]format=yuv420p,setsar=1,fps=$FPS,settb=1/$FPS[f];[0:v]setsar=1,fps=$FPS,settb=1/$FPS[v];[v][f]xfade=transition=fade:duration=$SEAM:offset=$(echo "$D - $SEAM" | bc)[o]" \
  -map "[o]" -c:v libx264 -preset ultrafast -qp 0 "$work/master.mkv"

ffmpeg -loglevel error -y -i "$work/master.mkv" -an -vf format=yuv420p -c:v libx264 -preset veryslow -crf 28 -profile:v high -movflags +faststart "$OUT/clip.mp4"
for pass in 1 2; do
  target=/dev/null; [ $pass = 2 ] && target="$OUT/clip.webm"
  ffmpeg -loglevel error -y -i "$work/master.mkv" -an -vf format=yuv420p -c:v libvpx-vp9 -crf 40 -b:v 0 -row-mt 1 \
    -deadline good -cpu-used 1 -pass $pass -passlogfile "$work/vp9" -f webm "$target"
done
ffmpeg -loglevel error -y -ss "$(echo "$D - $SEAM - 0.3" | bc)" -i "$work/take.mkv" -frames:v 1 -c:v libwebp -quality 82 "$OUT/clip-poster.webp"
ls -la "$OUT"/clip*
