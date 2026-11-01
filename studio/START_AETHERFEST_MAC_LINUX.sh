#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null || ! command -v npm >/dev/null;then
 echo 'Install Node.js 22+ first.' >&2;exit 1
fi
if [[ ! -d node_modules ]];then echo 'Installing Studio dependencies...';npm install;fi
node lab/aetherfest-college-lab/src/server.mjs &
TARGET_PID=$!
cleanup(){ kill "$TARGET_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
echo 'AETHER target: http://127.0.0.1:4400'
echo 'Studio dashboard: http://127.0.0.1:4100'
echo 'Leave this terminal running. Ctrl+C stops services.'
npm run dev
