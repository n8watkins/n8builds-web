#!/usr/bin/env bash
# Encodes Scribe's app tour from record.mjs's frames (round 5 of 2026-11-02):
# each frame held until the next one's time, resampled to 24 fps at 1280x800,
# its last 0.6s fading into its first frame so the loop has no seam. A silent
# looping video (VP9 WebM, H.264 MP4 fallback; -an, no audio track at all) and
# its poster (the first frame), into public/builds/scribe/.
#   scripts/scribe-tour/build-video.sh <framesDir>
set -euo pipefail
FRAMES=$(cd "$1" && pwd)
OUT=$(cd "$(dirname "$0")/../../public/builds/scribe" && pwd)
W=1280 H=800 FPS=24 SEAM=0.6
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT

# The concat list: every frame for as long as it was on screen.
node -e '
const { frames, end } = require(process.argv[1] + "/frames.json")
const lines = frames.map((f, i) => `file ${process.argv[1]}/${f.file}\nduration ${((frames[i + 1]?.t ?? end) - f.t).toFixed(4)}`)
lines.push(`file ${process.argv[1]}/${frames.at(-1).file}`)
require("fs").writeFileSync(process.argv[2], lines.join("\n") + "\n")
' "$FRAMES" "$work/list.txt"
first=$(node -e 'console.log(require(process.argv[1] + "/frames.json").frames[0].file)' "$FRAMES")

ffmpeg -loglevel error -y -f concat -safe 0 -i "$work/list.txt" -an \
  -vf "fps=$FPS,scale=$W:$H:flags=lanczos,format=yuv420p" -c:v libx264 -preset ultrafast -qp 0 "$work/take.mkv"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$work/take.mkv")
# The seam: the take's end fades into its first frame.
ffmpeg -loglevel error -y -i "$work/take.mkv" -loop 1 -framerate $FPS -t $SEAM -i "$FRAMES/$first" -an -filter_complex \
  "[1:v]scale=$W:$H:flags=lanczos,format=yuv420p,setsar=1,fps=$FPS,settb=1/$FPS[f];[0:v]setsar=1,fps=$FPS,settb=1/$FPS[v];[v][f]xfade=transition=fade:duration=$SEAM:offset=$(echo "$D - $SEAM" | bc)[o]" \
  -map "[o]" -c:v libx264 -preset ultrafast -qp 0 "$work/master.mkv"

ffmpeg -loglevel error -y -i "$work/master.mkv" -an -vf format=yuv420p -c:v libx264 -preset veryslow -crf 27 -profile:v high -movflags +faststart "$OUT/tour.mp4"
for pass in 1 2; do
  target=/dev/null; [ $pass = 2 ] && target="$OUT/tour.webm"
  ffmpeg -loglevel error -y -i "$work/master.mkv" -an -vf format=yuv420p -c:v libvpx-vp9 -crf 42 -b:v 0 -row-mt 1 \
    -deadline good -cpu-used 1 -pass $pass -passlogfile "$work/vp9" -f webm "$target"
done
ffmpeg -loglevel error -y -i "$FRAMES/$first" -vf scale=$W:$H:flags=lanczos -c:v libwebp -quality 82 "$OUT/tour-poster.webp"
ls -la "$OUT"/tour*
