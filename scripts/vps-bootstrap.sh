#!/usr/bin/env bash
# DeployHub VPS bootstrap — run over SSH (Release 2.0 worker), idempotent.
# Inputs via env: PUBLIC_API_URL, REGISTRATION_TOKEN, AGENT_DOCKER_IMAGE
set -euo pipefail

: "${PUBLIC_API_URL:?PUBLIC_API_URL required}"
: "${REGISTRATION_TOKEN:?REGISTRATION_TOKEN required}"
: "${AGENT_DOCKER_IMAGE:?AGENT_DOCKER_IMAGE required}"

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

if ! command -v git >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update && apt-get install -y git
  elif command -v apk >/dev/null 2>&1; then
    apk add --no-cache git
  fi
fi

curl -fsSL "${PUBLIC_API_URL}/api/agents/install.sh" | bash -s -- "${REGISTRATION_TOKEN}"
