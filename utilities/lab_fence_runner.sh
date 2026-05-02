#!/bin/bash
# lab_fence_runner.sh
# Per-code-fence test extractor and runner for MongoDB course labs.
#
# Strategy: for each lab .md, extract all fenced code blocks, classify each
# fence by language. Concatenate all RUN_EVAL/RUN_FILE javascript fences
# into one mongosh stdin script (preserving cross-fence variable state and
# allowing `use NAME` meta-commands), with try/catch + START/END boundary
# markers. Bash fences still run as separate processes.
#
# Prerequisites:
#   - MongoDB running on mongodb://localhost:27017 (replica set / standalone)
#   - For lab12 fences: mongos on localhost:27120 (else lab12 fences fail clearly)
#   - data/comprehensive_data_loader.js already loaded into insurance_company DB
#
# Usage:
#   utilities/lab_fence_runner.sh                # run every lab*.md
#   utilities/lab_fence_runner.sh lab04 lab07    # run only the named labs
#   utilities/lab_fence_runner.sh --list         # list extracted fences, no run

# Resolve project layout from the script's location.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LABS_DIR="$PROJECT_ROOT/labs"
TMP_DIR="${TMPDIR:-/tmp}/lab_fence_runner_$$"
mkdir -p "$TMP_DIR"
if [ -z "$LFR_KEEP_TMP" ]; then
    trap 'rm -rf "$TMP_DIR"' EXIT
else
    echo "Keeping TMP_DIR: $TMP_DIR" >&2
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

LIST_ONLY=false
SELECTED=()
for arg in "$@"; do
    case "$arg" in
        --list) LIST_ONLY=true ;;
        --help|-h)
            sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        lab*) SELECTED+=("$arg") ;;
        *) echo "Unknown argument: $arg" >&2; exit 2 ;;
    esac
done

# Build the list of lab files to process.
# Lab 14 lives in labs/lab14/ (the only lab with its own subdirectory because
# it bundles starter code); all other labs are top-level under labs/.
shopt -s nullglob
ALL_LAB_FILES=("$LABS_DIR"/lab*.md "$LABS_DIR"/lab14/lab*.md)
if [ ${#SELECTED[@]} -eq 0 ]; then
    LAB_FILES=("${ALL_LAB_FILES[@]}")
else
    LAB_FILES=()
    for sel in "${SELECTED[@]}"; do
        found=""
        for f in "${ALL_LAB_FILES[@]}"; do
            base="$(basename "$f")"
            if [[ "$base" == "$sel"* || "$base" == "${sel}_"* ]]; then
                found="$f"
                LAB_FILES+=("$f")
                break
            fi
        done
        if [ -z "$found" ]; then
            echo -e "${YELLOW}Warning: no lab file matches '$sel'${NC}" >&2
        fi
    done
fi

if [ ${#LAB_FILES[@]} -eq 0 ]; then
    echo -e "${RED}No lab files to process.${NC}"
    exit 2
fi

# Mongo URIs (honor env vars so we can run inside the course-tools container).
DEFAULT_URI="${MONGO_URI:-mongodb://localhost:27017/?directConnection=true}"
MONGOS_URI="${MONGOS_URI:-mongodb://localhost:27120/?directConnection=true}"

# When running inside the course-tools container the host-side ports
# (localhost:27017, localhost:27120) don't resolve to mongo containers.
# Extract host:port from the URIs so we can rewrite hardcoded references
# inside lab fences before execution.
_extract_hostport() {
    # mongodb://[user:pw@]host:port/.. -> host:port
    local uri="$1"
    local rest="${uri#mongodb://}"
    rest="${rest%%/*}"
    # strip credentials
    rest="${rest##*@}"
    # take only the first host:port
    rest="${rest%%,*}"
    echo "$rest"
}
RS_HOSTPORT="$(_extract_hostport "$DEFAULT_URI")"
SH_HOSTPORT="$(_extract_hostport "$MONGOS_URI")"

# Tracking.
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0
FAILED_FENCES=()
declare -a LAB_NAMES_ORDER=()
declare -a LAB_PASS_COUNTS=()
declare -a LAB_FAIL_COUNTS=()
declare -a LAB_SKIP_COUNTS=()
declare -a LAB_TOTAL_COUNTS=()
declare -a LAB_RUNNABLE_COUNTS=()

# Python helper that writes each fence to its own pair of files in $TMP_DIR:
#   $TMP_DIR/<lab_short>__<fence_num>.tag    contains the language tag
#   $TMP_DIR/<lab_short>__<fence_num>.body   contains the raw fence body
# It then prints one line per fence to stdout: "<fence_num>\t<tag>\t<bodyfile>"
extract_fences_py() {
    local lab_file="$1"
    local lab_short="$2"
    local out_dir="$3"
    python3 - "$lab_file" "$lab_short" "$out_dir" <<'PYEOF'
import re, sys, os
path, lab_short, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()
pattern = re.compile(r'^```([A-Za-z0-9_+\-]*)[ \t]*\n(.*?)^```[ \t]*$',
                     re.MULTILINE | re.DOTALL)
for i, m in enumerate(pattern.finditer(text), 1):
    tag = m.group(1) or '_NONE_'
    body = m.group(2)
    body_path = os.path.join(out_dir, f"{lab_short}__{i}.body")
    with open(body_path, 'w', encoding='utf-8') as bf:
        bf.write(body)
    print(f"{i}\t{tag}\t{body_path}")
PYEOF
}

# Decide what to do with a fence given its tag, body, and lab base name.
# Echoes one of:
#   RUN_JS              -- concatenate into the per-lab JS session
#   RUN_BASH_MONGOSH    -- run as standalone bash
#   SKIP_PWS            -- powershell
#   SKIP_LANG           -- non-shell language we don't run
#   SKIP_DESTRUCTIVE    -- destructive content
#   SKIP_BASH           -- bash, but not a runnable mongosh invocation
#   SKIP_INTERACTIVE    -- bash mongosh with no --eval / no stdin (would hang)
#   SKIP_SOURCE_ONLY    -- lab14 module bodies (covered by lab14*_test.sh)
classify_fence() {
    local tag="$1"
    local body="$2"
    local lab_base="$3"

    # Normalize empty tag sentinel.
    if [ "$tag" = "_NONE_" ]; then
        tag=""
    fi

    # Hard-skip destructive content regardless of tag.
    if echo "$body" | grep -Eq 'pkill|kill -9|rm -rf /|docker stop|docker rm|setup\.sh|teardown\.sh'; then
        echo "SKIP_DESTRUCTIVE"
        return
    fi

    case "$tag" in
        powershell|ps|ps1)
            echo "SKIP_PWS"
            ;;
        csharp|cs|python|py|json|env|yaml|yml|xml|html|css|text|txt|md|markdown|dockerfile|docker)
            echo "SKIP_LANG"
            ;;
        bash|shell|sh)
            local first
            first=$(echo "$body" | grep -vE '^\s*(#|$)' | head -n1)
            # Detect interactive mongosh: contains 'mongosh' but no --eval and no stdin redirect.
            if echo "$first" | grep -Eq '^\s*mongosh( |$)'; then
                # Whole body for full inspection (multi-line bash sometimes pipes).
                if echo "$body" | grep -Eq -- '--eval'; then
                    echo "RUN_BASH_MONGOSH"
                elif echo "$body" | grep -Eq '<' ; then
                    echo "RUN_BASH_MONGOSH"
                else
                    # Bare interactive mongosh -- would hang waiting for stdin.
                    echo "SKIP_INTERACTIVE"
                fi
            elif echo "$first" | grep -Eq '^\s*cd data\b'; then
                echo "RUN_BASH_MONGOSH"
            elif echo "$body" | grep -Eq 'mongosh.*<.*data/'; then
                echo "RUN_BASH_MONGOSH"
            else
                echo "SKIP_BASH"
            fi
            ;;
        "")
            # Untagged fence — likely sample output/text. Skip.
            echo "SKIP_LANG"
            ;;
        mongosh|javascript|js)
            # Lab 14b/c: skip module-style fences (require/class/module.exports) that
            # don't run any actual db operations. Those are covered by lab14*_test.sh.
            if [[ "$lab_base" == lab14* ]]; then
                if echo "$body" | head -n 6 | grep -Eq '^\s*(const|class|module\.exports|require\()'; then
                    if ! echo "$body" | grep -Eq 'db\.|MongoClient.*connect|insertOne|find\(|aggregate\(|updateOne|deleteOne'; then
                        echo "SKIP_SOURCE_ONLY"
                        return
                    fi
                fi
                # Lab14 fences that DO talk to MongoClient still need a Node project,
                # so they aren't runnable in mongosh. Skip them.
                if echo "$body" | grep -Eq 'require\(|MongoClient'; then
                    echo "SKIP_SOURCE_ONLY"
                    return
                fi
            fi
            echo "RUN_JS"
            ;;
        *)
            echo "SKIP_LANG"
            ;;
    esac
}

# Determine the URI for a fence based on lab name.
uri_for_lab() {
    local lab_base="$1"
    if [[ "$lab_base" == lab12* ]]; then
        echo "$MONGOS_URI"
    else
        echo "$DEFAULT_URI"
    fi
}

# Detect admin-risky fences (lab11 stepDown/reconfig).
is_admin_risky() {
    local lab_base="$1"
    local body="$2"
    if [[ "$lab_base" == lab11* ]] && echo "$body" | grep -Eq 'rs\.stepDown|rs\.reconfig'; then
        return 0
    fi
    return 1
}

# Truncate a string to N chars for display.
short() {
    local s="$1"
    local n="${2:-60}"
    s=$(echo "$s" | tr '\n\t' '  ' | tr -s ' ')
    if [ ${#s} -gt $n ]; then
        echo "${s:0:$n}..."
    else
        echo "$s"
    fi
}

# Build the concatenated JS script for a lab. Wraps each runnable JS fence
# in a try/catch and prints START/END/ERROR boundary markers around it.
# Calls a Python helper that knows how to safely emit JS as a string literal.
build_concat_js() {
    local out_js="$1"
    shift
    # Remaining args alternate: fence_num body_path risky(0/1)
    python3 - "$out_js" "$@" <<'PYEOF'
import sys, os
out_js = sys.argv[1]
# triples of (fence_num, body_path, risky)
triples = []
args = sys.argv[2:]
for i in range(0, len(args), 3):
    triples.append((args[i], args[i+1], args[i+2] == "1"))

def emit_fence(fence_num, body, risky):
    # Marker emission. We avoid wrapping mongosh meta-commands (`use NAME`,
    # `show collections`, etc.) in JS try/catch since those are mongosh shell
    # helpers that must be at the top level (not inside JS).
    # Strategy: split the body into chunks. Lines that are pure mongosh metas
    # are emitted OUTSIDE the try block; everything else goes inside.
    META_PREFIXES = ("use ",)
    META_EXACT = {"show collections", "show dbs", "show databases",
                  "show users", "show roles", "show profile", "show logs",
                  "it"}
    lines = body.splitlines()
    use_lines = []
    other_lines = []
    for ln in lines:
        stripped = ln.strip().rstrip(";").strip()
        if stripped in META_EXACT:
            use_lines.append(stripped)
            continue
        if stripped.startswith("use ") and not stripped.startswith("use("):
            target = stripped[4:].strip()
            # only treat as meta if target looks like a simple identifier (no parens, quotes, dots)
            if target and all(ch.isalnum() or ch in "_-" for ch in target):
                use_lines.append("use " + target)
                continue
        if stripped.startswith("show "):
            rest = stripped[5:].strip()
            if rest and all(ch.isalnum() or ch in "_-" for ch in rest):
                use_lines.append("show " + rest)
                continue
        other_lines.append(ln)

    out = []
    out.append(f'print("__FENCE_BOUNDARY__:{fence_num}:START");')
    # emit mongosh metas first so subsequent operations execute against the right db.
    for tgt in use_lines:
        out.append(tgt)
    # If only `use` and no other code, emit a no-op so the END marker is reached.
    body_remaining = "\n".join(other_lines).strip()
    if risky:
        # Wrap with double-layered try/catch including connection-loss tolerance.
        out.append("try {")
        if body_remaining:
            out.append(body_remaining)
        out.append(f'  print("__FENCE_BOUNDARY__:{fence_num}:END");')
        out.append('} catch (e) {')
        out.append(f'  print("ADMIN_RISKY caught: " + (e && e.message ? e.message : e));')
        out.append(f'  print("__FENCE_BOUNDARY__:{fence_num}:END");')
        out.append('}')
    else:
        out.append("try {")
        if body_remaining:
            out.append(body_remaining)
        out.append(f'  print("__FENCE_BOUNDARY__:{fence_num}:END");')
        out.append('} catch (e) {')
        out.append(f'  print("__FENCE_BOUNDARY__:{fence_num}:ERROR:" + (e && e.message ? e.message : e));')
        out.append('}')
    return "\n".join(out)

with open(out_js, "w", encoding="utf-8") as f:
    f.write("// Auto-generated concatenated lab fence script\n")
    for fence_num, body_path, risky in triples:
        with open(body_path, "r", encoding="utf-8") as bf:
            body = bf.read()
        f.write(emit_fence(fence_num, body, risky))
        f.write("\n")
    f.write('print("__FENCE_BOUNDARY__:ALL_DONE__");\n')
PYEOF
}

# Parse a lab output buffer to determine per-fence pass/fail.
# Args: out_file fence_num [fence_num ...]
# Emits one line per fence: "<fence_num>\t<status>\t<reason>"
#   status: PASS | FAIL
parse_concat_output() {
    local out_file="$1"
    shift
    python3 - "$out_file" "$@" <<'PYEOF'
import sys, re
out_file = sys.argv[1]
nums = sys.argv[2:]
with open(out_file, "r", encoding="utf-8", errors="replace") as f:
    content = f.read()

# Locate boundary markers.
# Build a list of indices for each fence: START_idx, END_idx, ERROR_idx
ERROR_PATTERN = re.compile(r'MongoServerError|SyntaxError|ReferenceError|uncaught exception|TypeError')

for n in nums:
    start_marker = f"__FENCE_BOUNDARY__:{n}:START"
    end_marker = f"__FENCE_BOUNDARY__:{n}:END"
    err_marker = f"__FENCE_BOUNDARY__:{n}:ERROR:"
    si = content.find(start_marker)
    ei = content.find(end_marker)
    eri = content.find(err_marker)
    if si == -1:
        # Never started -> mongosh likely died before this fence.
        print(f"{n}\tFAIL\tno-start-marker")
        continue
    # Find the segment from start to end-or-error-or-eof
    candidates = [x for x in (ei, eri) if x != -1 and x > si]
    if not candidates:
        # Started but never ended: fence is broken (script aborted, or runaway error).
        # Inspect text after START up to next fence's START (or EOF).
        next_starts = [m.start() for m in re.finditer(r'__FENCE_BOUNDARY__:\d+:START', content) if m.start() > si]
        end_of_segment = next_starts[0] if next_starts else len(content)
        seg = content[si:end_of_segment]
        print(f"{n}\tFAIL\tno-end-marker")
        continue
    end_pos = min(candidates)
    seg = content[si:end_pos]
    # Did we hit ERROR marker?
    if eri != -1 and eri == end_pos:
        # Extract error message
        line = content[eri:].split("\n", 1)[0]
        print(f"{n}\tFAIL\t{line}")
        continue
    # Otherwise, check the segment for spontaneous error patterns NOT caught.
    if ERROR_PATTERN.search(seg):
        # Some fences legitimately print "TypeError" within data; require it to look
        # like an actual error trace. We treat any of these patterns within START..END
        # as a real error since mongosh prints them as "Uncaught:" otherwise.
        # However if the fence text itself contains the literal word inside a string,
        # we can't reliably distinguish — so accept this as FAIL.
        print(f"{n}\tFAIL\toutput-contains-error-pattern")
        continue
    print(f"{n}\tPASS\tok")
PYEOF
}

# Process a single lab file.
process_lab() {
    local lab_file="$1"
    local lab_base
    lab_base=$(basename "$lab_file" .md)
    local lab_short
    lab_short=$(echo "$lab_base" | grep -oE '^lab[0-9]+[a-z]?')
    lab_short="${lab_short:-$lab_base}"

    local uri
    uri=$(uri_for_lab "$lab_base")

    echo ""
    echo -e "${BLUE}========================================================================${NC}"
    echo -e "${BLUE}LAB: $lab_base${NC}  ${DIM}(uri: $uri)${NC}"
    echo -e "${BLUE}========================================================================${NC}"

    # Pre-flight for lab12.
    if [[ "$lab_base" == lab12* ]]; then
        if ! mongosh "$uri" --quiet --eval 'db.runCommand({ping:1})' >/dev/null 2>&1; then
            echo -e "${YELLOW}NOTE: mongos at $uri is not reachable -- Lab 12 fences will fail.${NC}"
        fi
    fi

    local index_file="$TMP_DIR/${lab_short}_index"
    extract_fences_py "$lab_file" "$lab_short" "$TMP_DIR" > "$index_file"

    # If we're not running against the default localhost ports (i.e. we're
    # inside the course-tools container), rewrite hardcoded host:port
    # references in every fence body so JS fences using `new Mongo(...)`
    # also pick up the right URI.
    if [ "$RS_HOSTPORT" != "localhost:27017" ] || [ "$SH_HOSTPORT" != "localhost:27120" ]; then
        while IFS=$'\t' read -r _fnum _tag _bp || [ -n "$_fnum" ]; do
            [ -z "$_bp" ] && continue
            [ -f "$_bp" ] || continue
            if [ "$RS_HOSTPORT" != "localhost:27017" ]; then
                sed -i "s|localhost:27017|$RS_HOSTPORT|g" "$_bp"
            fi
            if [ "$SH_HOSTPORT" != "localhost:27120" ]; then
                sed -i "s|localhost:27120|$SH_HOSTPORT|g" "$_bp"
            fi
        done < "$index_file"
    fi

    if [ ! -s "$index_file" ]; then
        echo -e "${YELLOW}No fences found.${NC}"
        LAB_NAMES_ORDER+=("$lab_short")
        LAB_PASS_COUNTS+=(0)
        LAB_FAIL_COUNTS+=(0)
        LAB_SKIP_COUNTS+=(0)
        LAB_TOTAL_COUNTS+=(0)
        LAB_RUNNABLE_COUNTS+=(0)
        return
    fi

    local lab_pass=0 lab_fail=0 lab_skip=0 lab_total=0 lab_runnable=0

    # First pass: classify each fence, collect actions.
    declare -a fence_nums=()
    declare -a fence_tags=()
    declare -a fence_actions=()
    declare -a fence_bodies=()
    declare -a fence_previews=()
    declare -a fence_risky=()

    while IFS=$'\t' read -r fence_num tag body_path || [ -n "$fence_num" ]; do
        [ -z "$fence_num" ] && continue
        local body
        body=$(cat "$body_path")
        local action
        action=$(classify_fence "$tag" "$body" "$lab_base")
        local risky=0
        if is_admin_risky "$lab_base" "$body"; then
            risky=1
        fi
        local display_tag="$tag"
        if [ "$display_tag" = "_NONE_" ]; then
            display_tag=""
        fi
        fence_nums+=("$fence_num")
        fence_tags+=("$display_tag")
        fence_actions+=("$action")
        fence_bodies+=("$body_path")
        fence_previews+=("$(short "$body" 60)")
        fence_risky+=("$risky")
        lab_total=$((lab_total + 1))
    done < "$index_file"

    # In list mode: print and return.
    if [ "$LIST_ONLY" = true ]; then
        for i in "${!fence_nums[@]}"; do
            local fnum="${fence_nums[$i]}"
            local tag="${fence_tags[$i]}"
            local action="${fence_actions[$i]}"
            local preview="${fence_previews[$i]}"
            local header="$lab_short fence #$fnum [${tag:-none}]"
            case "$action" in
                SKIP_*)
                    echo -e "${DIM}  [${action}] $header :: $preview${NC}"
                    lab_skip=$((lab_skip + 1))
                    ;;
                *)
                    echo -e "  [$action] $header :: $preview"
                    lab_runnable=$((lab_runnable + 1))
                    ;;
            esac
        done
        LAB_NAMES_ORDER+=("$lab_short")
        LAB_PASS_COUNTS+=("$lab_runnable")
        LAB_FAIL_COUNTS+=(0)
        LAB_SKIP_COUNTS+=("$lab_skip")
        LAB_TOTAL_COUNTS+=("$lab_total")
        LAB_RUNNABLE_COUNTS+=("$lab_runnable")
        return
    fi

    # Build the concatenated JS script: collect all RUN_JS triples.
    local js_args=()
    declare -a js_fence_nums=()
    for i in "${!fence_nums[@]}"; do
        local fnum="${fence_nums[$i]}"
        local action="${fence_actions[$i]}"
        local body_path="${fence_bodies[$i]}"
        local risky="${fence_risky[$i]}"
        if [ "$action" = "RUN_JS" ]; then
            js_args+=("$fnum" "$body_path" "$risky")
            js_fence_nums+=("$fnum")
        fi
    done

    local concat_js="$TMP_DIR/${lab_short}_concat.js"
    local concat_out="$TMP_DIR/${lab_short}_concat.out"
    local parse_out="$TMP_DIR/${lab_short}_parsed.out"
    : > "$parse_out"
    if [ ${#js_args[@]} -gt 0 ]; then
        build_concat_js "$concat_js" "${js_args[@]}"
        echo -e "${CYAN}  Running ${#js_fence_nums[@]} concatenated JS fences via mongosh stdin...${NC}"
        mongosh "$uri" --quiet < "$concat_js" >"$concat_out" 2>&1
        # Always parse output regardless of mongosh exit code.
        parse_concat_output "$concat_out" "${js_fence_nums[@]}" > "$parse_out"
    fi

    # Iterate over all fences in source order, emit per-fence verdict.
    for i in "${!fence_nums[@]}"; do
        local fnum="${fence_nums[$i]}"
        local tag="${fence_tags[$i]}"
        local action="${fence_actions[$i]}"
        local body_path="${fence_bodies[$i]}"
        local preview="${fence_previews[$i]}"
        local risky="${fence_risky[$i]}"
        local header="$lab_short fence #$fnum [${tag:-none}]"

        case "$action" in
            SKIP_PWS|SKIP_LANG|SKIP_BASH|SKIP_DESTRUCTIVE|SKIP_INTERACTIVE|SKIP_SOURCE_ONLY)
                local reason
                case "$action" in
                    SKIP_PWS) reason="powershell" ;;
                    SKIP_LANG) reason="non-shell language ($tag)" ;;
                    SKIP_BASH) reason="bash (non-mongosh)" ;;
                    SKIP_DESTRUCTIVE) reason="destructive" ;;
                    SKIP_INTERACTIVE) reason="interactive mongosh (would hang)" ;;
                    SKIP_SOURCE_ONLY) reason="source-only module body (lab14*_test.sh covers it)" ;;
                esac
                echo -e "${DIM}-- Skip ($reason): $header :: $preview${NC}"
                lab_skip=$((lab_skip + 1))
                SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
                continue
                ;;
        esac

        # Runnable.
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        lab_runnable=$((lab_runnable + 1))
        echo -e "${CYAN}>> Testing: $header${NC} :: $preview"

        if [ "$action" = "RUN_BASH_MONGOSH" ]; then
            local body
            body=$(cat "$body_path")
            # Rewrite hardcoded host:port to whatever DEFAULT_URI / MONGOS_URI
            # point at, so the same fences work both natively (localhost) and
            # inside the course-tools container (mongo1 / mongo-mongos).
            if [ "$RS_HOSTPORT" != "localhost:27017" ]; then
                body="${body//localhost:27017/$RS_HOSTPORT}"
            fi
            if [ "$SH_HOSTPORT" != "localhost:27120" ]; then
                body="${body//localhost:27120/$SH_HOSTPORT}"
            fi
            local sh_file="$TMP_DIR/${lab_short}_${fnum}.sh"
            local out_file="$TMP_DIR/${lab_short}_${fnum}.out"
            {
                echo "#!/bin/bash"
                echo "cd \"$PROJECT_ROOT\" || exit 1"
                # When the host:port is non-default (i.e. we're inside the
                # course-tools container), wrap mongosh so bare `mongosh`
                # invocations in lab fences pick up the right URI.
                if [ "$RS_HOSTPORT" != "localhost:27017" ]; then
                    cat <<EOF_WRAPPER
_real_mongosh="\$(command -v mongosh)"
mongosh() {
    # Detect if a URI is already in the args; if so, pass through unchanged.
    for _a in "\$@"; do
        case "\$_a" in
            mongodb://*|mongodb+srv://*) "\$_real_mongosh" "\$@"; return ;;
        esac
    done
    # Otherwise inject our URI as the first positional argument.
    "\$_real_mongosh" "$DEFAULT_URI" "\$@"
}
EOF_WRAPPER
                fi
                printf '%s\n' "$body"
            } > "$sh_file"
            chmod +x "$sh_file"
            bash "$sh_file" >"$out_file" 2>&1
            local rc=$?
            local content
            content=$(cat "$out_file" 2>/dev/null)
            local pass=true
            if [ $rc -ne 0 ]; then
                pass=false
            elif echo "$content" | grep -Eq 'MongoServerError|SyntaxError|ReferenceError|uncaught exception|TypeError'; then
                pass=false
            fi
            if [ "$pass" = true ]; then
                echo -e "  ${GREEN}PASS${NC}"
                PASSED_TESTS=$((PASSED_TESTS + 1))
                lab_pass=$((lab_pass + 1))
            else
                echo -e "  ${RED}FAIL${NC} (exit=$rc)"
                echo -e "${DIM}---- last 20 lines of output ----${NC}"
                tail -n 20 "$out_file" | sed 's/^/    /'
                echo -e "${DIM}--------------------------------${NC}"
                FAILED_TESTS=$((FAILED_TESTS + 1))
                FAILED_FENCES+=("$lab_short:fence#$fnum - $preview")
                lab_fail=$((lab_fail + 1))
            fi
            continue
        fi

        # RUN_JS: look up parsed verdict from parse_out (bash 3.2 has no assoc arrays).
        local verdict_line s r
        verdict_line=$(grep -E "^${fnum}"$'\t' "$parse_out" | head -n1)
        s=$(echo "$verdict_line" | awk -F'\t' '{print $2}')
        r=$(echo "$verdict_line" | awk -F'\t' '{print $3}')
        if [ "$s" = "PASS" ]; then
            echo -e "  ${GREEN}PASS${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            lab_pass=$((lab_pass + 1))
        else
            echo -e "  ${RED}FAIL${NC} ($r)"
            # Print the segment from concat_out for debugging.
            local seg_file="$TMP_DIR/${lab_short}_${fnum}_seg.out"
            python3 - "$concat_out" "$fnum" > "$seg_file" <<'PYEOF'
import sys, re
out_file = sys.argv[1]
n = sys.argv[2]
with open(out_file, "r", encoding="utf-8", errors="replace") as f:
    content = f.read()
sm = f"__FENCE_BOUNDARY__:{n}:START"
si = content.find(sm)
if si == -1:
    print("(no start marker emitted; mongosh likely died earlier)")
    sys.exit(0)
# Find first end-or-error or next start
remaining = content[si:]
m = re.search(rf'__FENCE_BOUNDARY__:{n}:(END|ERROR:[^\n]*)|__FENCE_BOUNDARY__:\d+:START', remaining[len(sm):])
if not m:
    print(remaining)
else:
    print(remaining[:len(sm)+m.end()])
PYEOF
            echo -e "${DIM}---- segment for fence #$fnum (last 20 lines) ----${NC}"
            tail -n 20 "$seg_file" | sed 's/^/    /'
            echo -e "${DIM}--------------------------------${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            FAILED_FENCES+=("$lab_short:fence#$fnum - $preview")
            lab_fail=$((lab_fail + 1))
        fi
    done

    LAB_NAMES_ORDER+=("$lab_short")
    LAB_PASS_COUNTS+=("$lab_pass")
    LAB_FAIL_COUNTS+=("$lab_fail")
    LAB_SKIP_COUNTS+=("$lab_skip")
    LAB_TOTAL_COUNTS+=("$lab_total")
    LAB_RUNNABLE_COUNTS+=("$lab_runnable")
}

# Main loop.
for lab_file in "${LAB_FILES[@]}"; do
    process_lab "$lab_file"
done

# Summary.
echo ""
echo -e "${BLUE}========================================================================${NC}"
echo -e "${BLUE}SUMMARY${NC}"
echo -e "${BLUE}========================================================================${NC}"
printf "%-10s %8s %10s %8s %8s %8s\n" "LAB" "TOTAL" "RUNNABLE" "PASS" "FAIL" "SKIP"
printf "%-10s %8s %10s %8s %8s %8s\n" "----" "-----" "--------" "----" "----" "----"
for i in "${!LAB_NAMES_ORDER[@]}"; do
    printf "%-10s %8d %10d %8d %8d %8d\n" \
        "${LAB_NAMES_ORDER[$i]}" \
        "${LAB_TOTAL_COUNTS[$i]}" \
        "${LAB_RUNNABLE_COUNTS[$i]}" \
        "${LAB_PASS_COUNTS[$i]}" \
        "${LAB_FAIL_COUNTS[$i]}" \
        "${LAB_SKIP_COUNTS[$i]}"
done
echo ""
if [ "$LIST_ONLY" = true ]; then
    echo "List-only mode (no fences executed)."
    exit 0
fi

echo -e "Total runnable tests: ${TOTAL_TESTS}"
echo -e "  ${GREEN}Passed:${NC}  $PASSED_TESTS"
echo -e "  ${RED}Failed:${NC}  $FAILED_TESTS"
echo -e "  ${DIM}Skipped: $SKIPPED_TESTS${NC}"
if [ "$TOTAL_TESTS" -gt 0 ]; then
    pct=$(python3 -c "print(f'{100*$PASSED_TESTS/$TOTAL_TESTS:.1f}')")
    echo -e "  Pass rate: ${pct}%"
fi

if [ "$FAILED_TESTS" -gt 0 ]; then
    echo ""
    echo -e "${RED}Failed fences:${NC}"
    for f in "${FAILED_FENCES[@]}"; do
        echo "  - $f"
    done
    exit 1
fi
exit 0
