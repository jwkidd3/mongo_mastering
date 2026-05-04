#!/bin/bash
# Serve utilities/schedule.md as a live reveal.js deck via reveal-md.
#
# This is the "markdown is the source" workflow:
#   - No hand-written HTML wrapper needed
#   - Edit schedule.md in any editor; browser auto-reloads on save
#   - Custom styling injected from utilities/schedule.css
#
# Compare with serve_decks.sh, which serves the manual-wrapper version
# (utilities/schedule.html + utilities/schedule.md).
#
# Requirements: Node.js (for npx). reveal-md is fetched on first run.
# Usage:
#   bash utilities/serve_revealmd.sh           # default port 1948
#   bash utilities/serve_revealmd.sh 9000      # custom port

PORT="${1:-1948}"
THIS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v npx >/dev/null 2>&1; then
    echo "npx not found. Install Node.js first (brew install node)." >&2
    exit 127
fi

cat <<MSG
Starting reveal-md on http://localhost:$PORT
Source: $THIS_DIR/schedule.md  +  $THIS_DIR/schedule.css
Edit schedule.md in your editor; the browser auto-reloads.
Ctrl-C to stop.
MSG

# --separator / --vertical-separator: explicit so the regex matches schedule.md
#   (--- on its own line for horizontal, -- for vertical sub-slides).
# --css: inject our custom theming.
# --port: bind here.
# --watch is on by default; --static would build a folder of static HTML instead.
cd "$THIS_DIR" && exec npx --yes reveal-md schedule.md \
    --theme white \
    --css schedule.css \
    --port "$PORT" \
    --separator '\r?\n---\r?\n' \
    --vertical-separator '\r?\n--\r?\n'
