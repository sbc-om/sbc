#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/SERVER"
CERTBOT_DIR="$SERVER_DIR/.certbot"
DOMAIN="${DOMAIN:-sbc.om}"
WILDCARD_DOMAIN="*.${DOMAIN}"
EMAIL="${LETSENCRYPT_EMAIL:-admin@${DOMAIN}}"
CF_TOKEN="${CLOUDFLARE_API_TOKEN:-${CF_DNS_API_TOKEN:-${CF_API_TOKEN:-}}}"
FORCE_RENEW="${FORCE_RENEW:-0}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if [[ -z "$CF_TOKEN" ]]; then
  echo "Cloudflare token is missing. Set CLOUDFLARE_API_TOKEN (or CF_DNS_API_TOKEN)." >&2
  exit 2
fi

mkdir -p "$CERTBOT_DIR/config" "$CERTBOT_DIR/work" "$CERTBOT_DIR/logs"
CLOUDFLARE_INI="$CERTBOT_DIR/cloudflare.ini"
cat >"$CLOUDFLARE_INI" <<EOF
# Managed by scripts/provision-wildcard-cert.sh
dns_cloudflare_api_token = $CF_TOKEN
EOF
chmod 600 "$CLOUDFLARE_INI"

CERTBOT_ARGS=(
  certonly
  --dns-cloudflare
  --dns-cloudflare-credentials /run/secrets/cloudflare.ini
  --agree-tos
  --non-interactive
  --email "$EMAIL"
  --cert-name "$DOMAIN"
  --expand
  -d "$DOMAIN"
  -d "$WILDCARD_DOMAIN"
  --config-dir /etc/letsencrypt
  --work-dir /var/lib/letsencrypt
  --logs-dir /var/log/letsencrypt
)

if [[ "$FORCE_RENEW" == "1" ]]; then
  CERTBOT_ARGS+=(--force-renewal)
fi

echo "Requesting/renewing certificate for $DOMAIN and $WILDCARD_DOMAIN ..."
docker run --rm \
  -v "$CERTBOT_DIR/config:/etc/letsencrypt" \
  -v "$CERTBOT_DIR/work:/var/lib/letsencrypt" \
  -v "$CERTBOT_DIR/logs:/var/log/letsencrypt" \
  -v "$CLOUDFLARE_INI:/run/secrets/cloudflare.ini:ro" \
  certbot/dns-cloudflare:latest \
  "${CERTBOT_ARGS[@]}"

FULLCHAIN="$CERTBOT_DIR/config/live/$DOMAIN/fullchain.pem"
PRIVKEY="$CERTBOT_DIR/config/live/$DOMAIN/privkey.pem"

if [[ ! -f "$FULLCHAIN" || ! -f "$PRIVKEY" ]]; then
  echo "Certificate files not found after issuance" >&2
  exit 3
fi

if ! docker ps --format '{{.Names}}' | grep -q '^proxy$'; then
  echo "Container 'proxy' is not running. Start SERVER stack first." >&2
  exit 4
fi

echo "Installing certificate into proxy container ..."
docker cp "$FULLCHAIN" "proxy:/etc/nginx/certs/${DOMAIN}.crt"
docker cp "$PRIVKEY" "proxy:/etc/nginx/certs/${DOMAIN}.key"

echo "Reloading proxy ..."
docker exec proxy nginx -s reload

echo "Done. Wildcard TLS is installed for $DOMAIN"
