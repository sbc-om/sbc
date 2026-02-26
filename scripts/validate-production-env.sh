#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Env file not found: $ENV_FILE"
  echo "Create it first (example): cp .env.production.example .env"
  exit 1
fi

read_env_value() {
  local key="$1"
  local raw
  raw="$(grep -E "^[[:space:]]*${key}=" "$ENV_FILE" | tail -n1 || true)"
  raw="${raw#*=}"
  raw="${raw%%[[:space:]]#*}"
  raw="${raw%\"}"
  raw="${raw#\"}"
  raw="${raw%\'}"
  raw="${raw#\'}"
  printf "%s" "$raw"
}

is_placeholder() {
  local value="${1:-}"
  local upper
  upper="$(printf "%s" "$value" | tr '[:lower:]' '[:upper:]')"
  [[ -z "$value" || "$upper" == "CHANGE_ME" || "$value" == "YOUR_CLOUDFLARE_API_TOKEN" ]]
}

check_required() {
  local key="$1"
  local value
  value="$(read_env_value "$key")"
  if is_placeholder "$value"; then
    echo "❌ Missing/placeholder: $key"
    return 1
  fi
  return 0
}

check_min_len() {
  local key="$1"
  local min_len="$2"
  local value
  value="$(read_env_value "$key")"

  if is_placeholder "$value"; then
    echo "❌ Missing/placeholder: $key"
    return 1
  fi

  if [[ ${#value} -lt $min_len ]]; then
    echo "❌ Too short: $key (min $min_len chars)"
    return 1
  fi

  return 0
}

failed=0

echo "🔎 Validating env file: $ENV_FILE"

# Domain and SSL automation
check_required "DOMAIN" || failed=1
check_required "LETSENCRYPT_EMAIL" || failed=1
check_required "CLOUDFLARE_API_TOKEN" || failed=1

# Database and auth critical secrets
check_required "POSTGRES_PASSWORD" || failed=1
check_min_len "AUTH_JWT_SECRET" 32 || failed=1
check_min_len "CRON_SECRET" 24 || failed=1
check_min_len "DB_ENCRYPTION_KEY" 32 || failed=1
check_required "ADMIN_PASSWORD" || failed=1

# Must include wildcard routing for subdomains
virtual_host="$(read_env_value "VIRTUAL_HOST")"
if [[ -z "$virtual_host" || "$virtual_host" != *"*."* ]]; then
  echo "❌ VIRTUAL_HOST must include wildcard host (example: *.sbc.om)"
  failed=1
fi

if [[ "$failed" -ne 0 ]]; then
  echo
  echo "Env validation failed. Fix the values above, then rerun start script."
  exit 2
fi

echo "✅ Env validation passed"
