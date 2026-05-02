#!/bin/bash
# Root-level convenience wrapper. Forwards to scripts/setup.sh.
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
exec "${SCRIPT_DIR}/scripts/setup.sh" "$@"
