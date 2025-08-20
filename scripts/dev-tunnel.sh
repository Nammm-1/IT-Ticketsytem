#!/usr/bin/env bash
set -euo pipefail

# Defaults
PORT="${PORT:-5001}"

# Configure ngrok auth token if provided
if [[ -n "${NGROK_AUTHTOKEN:-}" ]]; then
  npx -y ngrok config add-authtoken "${NGROK_AUTHTOKEN}"
fi

# Run server and ngrok together
concurrently -r -k -n server,ngrok \
  "NODE_ENV=development tsx server/index.ts" \
  "npx -y ngrok http --log=stdout --log-format=term ${PORT}"


