#!/bin/bash
# Serve the presentations + this directory's markdown-backed decks (e.g.
# utilities/schedule.html) over HTTP so reveal.js's markdown plugin can fetch()
# external .md files. Without this, opening the HTML via file:// produces a
# blank page (browsers block fetch() of local files).
#
# Usage:
#   bash utilities/serve_decks.sh           # default port 8000
#   bash utilities/serve_decks.sh 9000      # custom port
#
# Then open in a browser:
#   http://localhost:8000/utilities/schedule.html
#   http://localhost:8000/presentations/mongodb_day1_presentation.html
#   ...

PORT="${1:-8000}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cat <<MSG
Serving $REPO_ROOT on http://localhost:$PORT
Open any of:
  http://localhost:$PORT/utilities/schedule.html
  http://localhost:$PORT/presentations/mongodb_day1_presentation.html
  http://localhost:$PORT/presentations/mongodb_day2_presentation.html
  http://localhost:$PORT/presentations/mongodb_day3_presentation.html
Ctrl-C to stop.
MSG

cd "$REPO_ROOT" && exec python3 -m http.server "$PORT"
