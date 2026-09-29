#!/usr/bin/env bash
# End-to-end demo (no credentials, no network). Requires Node 18+.
set -euo pipefail
cd "$(dirname "$0")/.."
node demo/run.mjs
