#!/bin/bash
# Build a static HTML deck from utilities/schedule.md using reveal-md --static.
#
# Output goes to utilities/static/schedule/ by default. The result is a
# self-contained directory you can:
#   - open locally:  open utilities/static/schedule/index.html
#   - host anywhere static files work (S3, GitHub Pages, nginx, etc.) -- no
#     dev server needed
#
# Requirements: Node.js (for npx). reveal-md is fetched on first run.
# Usage:
#   bash utilities/build_static.sh                 # default output dir
#   bash utilities/build_static.sh /tmp/sched      # custom dir

THIS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$THIS_DIR/.." && pwd)"
# Output goes UNDER the repo root, not under utilities/, because reveal-md's
# --static mode copies the source directory into the output as a static-asset
# dir; if the output were inside utilities/ that creates infinite recursion.
OUT_DIR="${1:-$REPO_ROOT/dist/schedule}"

if ! command -v npx >/dev/null 2>&1; then
    echo "npx not found. Install Node.js first (brew install node)." >&2
    exit 127
fi

# Clean previous output so removed files don't linger.
rm -rf "$OUT_DIR"
mkdir -p "$(dirname "$OUT_DIR")"

cd "$THIS_DIR" && npx --yes reveal-md schedule.md \
    --theme white \
    --css schedule.css \
    --separator '\r?\n---\r?\n' \
    --vertical-separator '\r?\n--\r?\n' \
    --static "$OUT_DIR"

echo
echo "Built static deck in: $OUT_DIR"
echo "Open with:  open $OUT_DIR/index.html"
echo
echo "Folder is fully self-contained -- copy/host anywhere."
