#!/bin/bash
# SessionStart hook: launches the API server, Expo/Metro, and the iOS Simulator
# for the Grind Notes app so a fresh Claude Code session has the dev stack
# already running. Safe to re-run: skips anything already listening on its port.
set -uo pipefail

REPO="/Users/ale/devacademy/personal-projects/workout-log-app-mobile-v2"
LOG_DIR="$REPO/.claude/logs"
mkdir -p "$LOG_DIR"

port_listening() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

if ! port_listening 3001; then
  (cd "$REPO" && nohup npm run dev:api > "$LOG_DIR/api.log" 2>&1 &)
fi

if ! port_listening 8081; then
  (cd "$REPO" && npm run update:mobile-env > "$LOG_DIR/mobile-env.log" 2>&1)
  open -a Simulator
  sleep 3
  (cd "$REPO/apps/mobile" && DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer nohup npx expo start --ios > "$LOG_DIR/expo.log" 2>&1 &)
fi

echo '{"systemMessage": "Grind Notes dev environment starting: API on :3001, Expo/Metro on :8081, iOS Simulator opening."}'
