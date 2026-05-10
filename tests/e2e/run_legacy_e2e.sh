#!/bin/sh
set -eu

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
PORT=${LEGACY_TEST_PORT:-8081}
BASE_URL=${BASE_URL:-http://127.0.0.1:$PORT}
LOG_FILE=${E2E_LOG_FILE:-/tmp/eastfever-legacy-e2e.log}

python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT_DIR" >"$LOG_FILE" 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 1
BASE_URL="$BASE_URL" python3 "$ROOT_DIR/tests/e2e/test_pages.py"
