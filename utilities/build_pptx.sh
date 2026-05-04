#!/bin/bash
# Build PowerPoint (.pptx) versions of any markdown decks under utilities/.
# Currently produces utilities/schedule.pptx from utilities/schedule.md.
#
# Requirements: pandoc (brew install pandoc / apt install pandoc).
#
# How it works:
#   - --slide-level=2 forces every level-2 markdown header (## Day 1) to start
#     a new pptx slide. Without this pandoc auto-detects and sometimes splits.
#   - The day-totals row is the LAST ROW of each day's table (e.g.,
#     "**Day 1 total** | **presentation 105 min · lab 225 min**") so pandoc
#     keeps it on the same slide instead of creating an overflow continuation.
#   - Output is plain default-themed pptx -- editable text, but no peach
#     cards / green section banners / pill badges (see TRADEOFFS below).

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v pandoc >/dev/null 2>&1; then
    echo "pandoc not found. Install: brew install pandoc  (or apt install pandoc)" >&2
    exit 127
fi

build_one() {
    local md="$1" pptx="$2"
    [ -f "$md" ] || { echo "missing source: $md"; return 1; }
    pandoc -f markdown -t pptx --slide-level=2 "$md" -o "$pptx"
    echo "wrote $pptx"
}

# schedule.pptx is generated from a transformed copy of schedule.md so the
# day-totals lines fold into the table (avoids overflow continuation slides).
TMP_MD="$(mktemp /tmp/schedule_pptx.XXXXXX.md)"
trap 'rm -f "$TMP_MD"' EXIT

awk '
    # Buffer one line ahead so we can drop a blank line that precedes a totals
    # paragraph -- pandoc treats the blank as a table terminator, splitting the
    # table across two slides.
    NR == 1 { prev = $0; next }
    /^\*\*Day [0-9]+ total:\*\*/ {
        if (prev !~ /^[[:space:]]*$/) print prev
        gsub(/^\*\*Day [0-9]+ total:\*\* /, "")
        printf "| **Day total** | **%s** |\n", $0
        prev = ""
        next
    }
    { print prev; prev = $0 }
    END { if (prev != "") print prev }
' "$REPO_ROOT/utilities/schedule.md" > "$TMP_MD"

build_one "$TMP_MD" "$REPO_ROOT/utilities/schedule.pptx"

cat <<'NOTES'

TRADEOFFS (pandoc md->pptx is intentionally plain):
  - Default PowerPoint theme. No green section banners, no peach lab cards,
    no .lab-duration pill, no row tinting. The text and tables are correct;
    the visual chrome from the reveal.js decks does not transfer.
  - To preserve more styling, supply a reference.pptx via
    --reference-doc=path/to/template.pptx that defines the theme you want.
  - For pixel-perfect copies of the reveal.js decks, use decktape to export
    each deck as PDF instead -- see the README discussion of pptx tradeoffs.
NOTES
