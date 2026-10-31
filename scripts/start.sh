#!/bin/sh
# Ghost in the Machine — start script.
# Wakes Ollama locally (if present), then serves the production Next.js build
# on 0.0.0.0:$PORT. Works with the internet off once the image is built.
set -eu

export NEXT_TELEMETRY_DISABLED=1
PORT="${PORT:-3000}"
MODEL="${OLLAMA_MODEL:-qwen2.5:3b-instruct}"
OLLAMA="${OLLAMA_URL:-http://localhost:11434}"
# keep model blobs in one predictable place (CPU-only install; no GPU runtimes)
export OLLAMA_MODELS="${OLLAMA_MODELS:-/usr/local/lib/ollama/models}"

if command -v ollama >/dev/null 2>&1; then
  echo "[ghost] waking ollama..."
  ollama serve >/tmp/ollama-serve.log 2>&1 &
  i=0
  until curl -fsS "${OLLAMA}/api/tags" >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "$i" -ge 60 ]; then
      echo "[ghost] ollama did not wake (see /tmp/ollama-serve.log); whispers will be dormant"
      break
    fi
    sleep 1
  done
  if curl -fsS "${OLLAMA}/api/tags" >/dev/null 2>&1; then
    if ! ollama list 2>/dev/null | grep -q "$MODEL"; then
      echo "[ghost] summoning model ${MODEL} in the background (first run only)..."
      ollama pull "$MODEL" >/tmp/ollama-pull.log 2>&1 &
    else
      echo "[ghost] model ${MODEL} is present"
    fi
  fi
else
  echo "[ghost] ollama binary not found on PATH — whispers will be dormant"
fi

if [ ! -f .next/BUILD_ID ]; then
  echo "[ghost] no production build found; building..."
  if command -v bun >/dev/null 2>&1; then
    bun run build
  else
    npm run build
  fi
fi

echo "[ghost] haunted shell listening on 0.0.0.0:${PORT}"
exec ./node_modules/.bin/next start -p "$PORT" -H 0.0.0.0
