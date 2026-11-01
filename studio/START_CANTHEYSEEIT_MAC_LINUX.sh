#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

MODE="${1:---both}"
case "$MODE" in
  --both|--grocery|--clinic|--check) ;;
  *) echo 'Usage: bash START_CANTHEYSEEIT_MAC_LINUX.sh [--both|--grocery|--clinic|--check]' >&2; exit 2;;
esac

if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo 'Node.js 22+ and npm are required. Install them, then run this script again.' >&2
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if (( NODE_MAJOR < 22 )); then
  echo "Node.js 22+ is required; found $(node --version)." >&2
  exit 1
fi

if [[ "$MODE" == '--check' ]]; then
  echo 'Running independent checks...'
  node --check dashboard/app.js
  node --test tests/frontend/*.test.mjs tests/link/*.test.mjs lab/grocery-security-lab/tests/lab.test.mjs
  echo 'Checks complete. To launch: bash START_CANTHEYSEEIT_MAC_LINUX.sh --both'
  exit 0
fi

if [[ ! -d node_modules/tsx ]]; then
  echo 'Installing backend dependencies (internet access required on first run)...'
  npm install --no-audit --no-fund
fi

pids=()
cleanup() {
  trap - EXIT INT TERM
  echo 'Stopping local demo services...'
  for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [[ "$MODE" == '--both' || "$MODE" == '--grocery' ]]; then
  echo 'Starting synthetic grocery shop at http://127.0.0.1:4200/'
  npm run lab:start & pids+=("$!")
fi
if [[ "$MODE" == '--both' || "$MODE" == '--clinic' ]]; then
  echo 'Starting fictional clinic at http://127.0.0.1:4300/'
  npm run hospital:start & pids+=("$!")
fi

echo 'Starting CanTheySeeIt? at http://127.0.0.1:4100/'
npm run dev & pids+=("$!")

for i in {1..25}; do
  if node -e "fetch('http://127.0.0.1:4100/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then
    echo 'Ready! Visit http://127.0.0.1:4100/'
    if command -v open >/dev/null; then open 'http://127.0.0.1:4100/' >/dev/null 2>&1 || true
    elif command -v xdg-open >/dev/null; then xdg-open 'http://127.0.0.1:4100/' >/dev/null 2>&1 || true
    fi
    break
  fi
  sleep 1
 done
 echo 'Press Ctrl+C to stop the local services.'
 wait
