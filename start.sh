#!/usr/bin/env bash
# Start genesis-manager (kills any existing servers first)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/builds/react_vite"

echo "Stopping any running genesis-manager servers..."
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true
sleep 1

echo "Starting genesis-manager..."
cd "$APP_DIR"
exec npm run dev:all
