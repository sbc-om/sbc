#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-sbc.om}"
EMAIL="${LETSENCRYPT_EMAIL:-admin@${DOMAIN}}"
TOKEN="${CLOUDFLARE_API_TOKEN:-}"
INTERVAL_HOURS="${CERT_RENEW_INTERVAL_HOURS:-12}"

if [[ -z "$TOKEN" ]]; then
  echo "[wildcard-cert] CLOUDFLARE_API_TOKEN is empty. Waiting (no wildcard cert issuance)."
  sleep infinity
fi

CLOUDFLARE_INI="/tmp/cloudflare.ini"
cat >"$CLOUDFLARE_INI" <<EOF
# generated at container start
dns_cloudflare_api_token = $TOKEN
EOF
chmod 600 "$CLOUDFLARE_INI"

certbot_issue_or_renew() {
  echo "[wildcard-cert] Issuing/renewing certificate for $DOMAIN and *.$DOMAIN"
  certbot certonly \
    --dns-cloudflare \
    --dns-cloudflare-credentials "$CLOUDFLARE_INI" \
    --agree-tos \
    --non-interactive \
    --email "$EMAIL" \
    --keep-until-expiring \
    --config-dir /etc/letsencrypt \
    --work-dir /var/lib/letsencrypt \
    --logs-dir /var/log/letsencrypt \
    -d "$DOMAIN" -d "*.$DOMAIN"

  local fullchain="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
  local privkey="/etc/letsencrypt/live/$DOMAIN/privkey.pem"

  if [[ ! -f "$fullchain" || ! -f "$privkey" ]]; then
    echo "[wildcard-cert] Certificate files not found after issuance"
    return 1
  fi

  # Keep local copies (useful when proxy is in same compose stack)
  cp "$fullchain" "/etc/nginx/certs/${DOMAIN}.crt"
  cp "$privkey" "/etc/nginx/certs/${DOMAIN}.key"

  # Always try to install into running proxy container (global/external stack)
  docker cp "$fullchain" "proxy:/etc/nginx/certs/${DOMAIN}.crt" || true
  docker cp "$privkey" "proxy:/etc/nginx/certs/${DOMAIN}.key" || true

  if docker ps --format '{{.Names}}' | grep -q '^proxy$'; then
    echo "[wildcard-cert] Reloading proxy"
    docker exec proxy nginx -s reload || true
  else
    echo "[wildcard-cert] Proxy container not found for reload"
  fi

  echo "[wildcard-cert] Certificate sync complete"
}

certbot_issue_or_renew

while true; do
  sleep "$((INTERVAL_HOURS * 3600))"
  certbot_issue_or_renew || true
done
