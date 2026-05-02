#!/bin/bash
# Root-level convenience wrapper. Forwards to scripts/test.sh.
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
exec "${SCRIPT_DIR}/scripts/test.sh" "$@"
