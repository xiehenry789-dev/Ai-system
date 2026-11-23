#!/usr/bin/env bash
# Usage: make_trailer.sh [out.mp4] [fps] [width] [height]   (run from the repository root)
# TRAILER_JOBS=n records the shots in n browsers side by side (default 2).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)";ROOT="$(cd "$HERE/../../../.." && pwd)"
OUT="${1:-$ROOT/wizard-meadow/trailer/WizardMeadow-trailer.mp4}";FPS="${2:-20}";W="${3:-960}";H="${4:-540}";JOBS="${TRAILER_JOBS:-2}"
WORK="${TRAILER_WORK:-$(mktemp -d)}";mkdir -p "$WORK/frames" "$(dirname "$OUT")";echo "work folder: $WORK"
NS=$(grep -cE "^ (\{dur:|spellCut\(|\{\.\.\.spellCut)" "$HERE/shots.js")
pids=()
for j in $(seq 0 $((JOBS-1))); do
  list=$(seq $j $JOBS $((NS-1)) | paste -sd, -)
  TRAILER_ONLY="$list" node "$HERE/record.js" "$ROOT/wizard-meadow/index.html" "$WORK/frames" "$FPS" "$W" "$H" > "$WORK/rec$j.log" 2>&1 & pids+=($!)
  sleep 20
done
for p in "${pids[@]}"; do wait "$p" || { echo "a recorder failed, see $WORK/rec*.log"; exit 1; }; done
cp "$(ls "$WORK"/frames/cuts-*.json | head -1)" "$WORK/frames/cuts.json"
i=0;mkdir -p "$WORK/seq";for f in $(ls "$WORK"/frames/s*_*.jpg | sort); do ln -sf "$f" "$WORK/seq/$(printf 'f%05d.jpg' $i)";i=$((i+1));done
echo "frames: $i"
python3 "$HERE/music.py" "$WORK/frames/cuts.json" "$WORK/music.wav"
ffmpeg -y -loglevel error -framerate "$FPS" -i "$WORK/seq/f%05d.jpg" -i "$WORK/music.wav" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
echo "trailer: $OUT"
