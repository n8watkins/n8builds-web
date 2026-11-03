#!/usr/bin/env bash
# Makes the stills of the app for Scribe's build page from the scenes
# capture.mjs took, into public/builds/scribe/. (Round 4's crossfade video of
# these scenes gave way in round 5 to a real screen recording: record.mjs and
# build-video.sh.)
#   scripts/scribe-tour/build.sh <scenesDir>
set -euo pipefail
SCENES=$(cd "$1" && pwd)
OUT=$(cd "$(dirname "$0")/../../public/builds/scribe" && pwd)
W=1280 H=800

# A few of the views, as stills.
still() { ffmpeg -loglevel error -y -i "$1" -vf scale=$W:$H:flags=lanczos -c:v libwebp -quality "${3:-86}" "$OUT/$2.webp"; }
for name in home history models-language appearance-emerald; do still "$(ls "$SCENES"/*-"$name".png)" "app-$name"; done
ls -la "$OUT"
