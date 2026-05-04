#!/bin/bash
# Build a single self-contained HTML file from schedule.md + schedule.css.
#
# The result opens directly via double-click (file://) -- no http server, no
# folder of assets. Markdown content is inlined into a <textarea data-template>
# so reveal.js's markdown plugin reads it without fetch(). Reveal.js + theme
# come from CDN (browsers allow script/style loading from CDNs even on file://;
# only fetch() is restricted).
#
# Output: dist/schedule_single.html (gitignored; regenerate any time).
#
# Usage:
#   bash utilities/build_single_html.sh

set -e

THIS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$THIS_DIR/.." && pwd)"
OUT="${1:-$REPO_ROOT/dist/schedule_single.html}"
mkdir -p "$(dirname "$OUT")"

MD="$THIS_DIR/schedule.md"
CSS="$THIS_DIR/schedule.css"

[ -f "$MD" ]  || { echo "missing $MD"  >&2; exit 1; }
[ -f "$CSS" ] || { echo "missing $CSS" >&2; exit 1; }

# Use python for the file assembly so we don't have to wrestle with shell
# escape rules around HTML and markdown content.
python3 - "$MD" "$CSS" "$OUT" <<'PY'
import sys, pathlib
md_path, css_path, out_path = map(pathlib.Path, sys.argv[1:4])
md  = md_path.read_text()
css = css_path.read_text()

# Reveal.js + theme + markdown plugin all from cdnjs. Works on file://.
HTML = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>MongoDB Mastering — Course Timings</title>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/reveal.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/theme/white.min.css">

    <style>
{css}
    </style>
</head>
<body>
    <div class="reveal">
        <div class="slides">
            <section data-markdown
                     data-separator="\\r?\\n---\\r?\\n"
                     data-separator-vertical="\\r?\\n--\\r?\\n">
                <textarea data-template>
{md}
                </textarea>
            </section>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/reveal.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/plugin/markdown/markdown.min.js"></script>
    <script>
        Reveal.initialize({{
            hash: true, controls: true, progress: true, center: true,
            transition: 'slide',
            plugins: [ RevealMarkdown ],
            width: 1280, height: 900, margin: 0.06,
            minScale: 0.2, maxScale: 1.5,
        }});
    </script>
</body>
</html>
"""
out_path.write_text(HTML)
print(f"wrote {out_path}  ({out_path.stat().st_size:,} bytes)")
PY

echo
echo "Open with:  open $OUT"
echo "Single file. Double-clickable. Needs internet for the reveal.js CDN."
