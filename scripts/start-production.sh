#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

echo "0) Validating production env ..."
"$ROOT_DIR/scripts/validate-production-env.sh" "${ENV_FILE:-$ROOT_DIR/.env}"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "docker compose is required" >&2
  exit 1
fi

echo "1) Starting full stack (proxy + tls + app + db) ..."
(
  cd "$ROOT_DIR"
  "${COMPOSE[@]}" up -d --build
)

echo "2) Final diagnostics ..."
DOMAIN="${DOMAIN:-sbc.om}"
TARGET_SUBDOMAIN="${TEST_SUBDOMAIN:-spirithub}.${DOMAIN}"
TARGET_IP="${TARGET_IP:-}"

if [[ -z "$TARGET_IP" ]]; then
  TARGET_IP="$(getent hosts "$DOMAIN" | awk '{print $1}' | head -n1 || true)"
fi

if [[ -n "$TARGET_IP" ]]; then
  "$ROOT_DIR/scripts/diagnose-subdomain.sh" "$TARGET_SUBDOMAIN" "$TARGET_IP" || true
else
  echo "Could not detect target IP for diagnostics."
fi

echo "Startup automation completed."
