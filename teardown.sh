#!/bin/bash
# Root-level convenience wrapper. Forwards to scripts/teardown.sh.
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
exec "${SCRIPT_DIR}/scripts/teardown.sh" "$@"
