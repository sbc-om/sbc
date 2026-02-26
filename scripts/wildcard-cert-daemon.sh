#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-sbc.om}"
EMAIL="${LETSENCRYPT_EMAIL:-admin@${DOMAIN}}"
TOKEN="${CLOUDFLARE_API_TOKEN:-}"
INTERVAL_HOURS="${CERT_RENEW_INTERVAL_HOURS:-12}"
SELF_CONTAINER_REF="${HOSTNAME:-sbc-wildcard-cert}"

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
    --cert-name "$DOMAIN" \
    --expand \
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

  # Try installing into running proxy container directly.
  local copied_into_proxy=0
  if docker cp "${SELF_CONTAINER_REF}:${fullchain}" "proxy:/etc/nginx/certs/${DOMAIN}.crt" >/dev/null 2>&1 && \
     docker cp "${SELF_CONTAINER_REF}:${privkey}" "proxy:/etc/nginx/certs/${DOMAIN}.key" >/dev/null 2>&1; then
    copied_into_proxy=1
  else
    echo "[wildcard-cert] Direct copy to proxy failed (likely read-only mount). Trying volume sync fallback..."
  fi

  # Fallback: write cert files into proxy cert volume via helper container.
  if [[ "$copied_into_proxy" -ne 1 ]]; then
    local certs_volume
    certs_volume="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/nginx/certs"}}{{.Name}}{{end}}{{end}}' proxy 2>/dev/null || true)"
    if [[ -n "$certs_volume" ]]; then
      local helper
      helper="$(docker create -v "${certs_volume}:/proxy-certs" alpine:3.21 sh -c 'sleep 120')"
      docker cp "${SELF_CONTAINER_REF}:${fullchain}" "${helper}:/proxy-certs/${DOMAIN}.crt"
      docker cp "${SELF_CONTAINER_REF}:${privkey}" "${helper}:/proxy-certs/${DOMAIN}.key"
      docker rm -f "$helper" >/dev/null 2>&1 || true
      echo "[wildcard-cert] Synced certificate into proxy volume: ${certs_volume}"
    else
      echo "[wildcard-cert] Could not detect proxy cert volume; skipping volume sync fallback"
    fi
  fi

  if ! docker exec proxy test -s "/etc/nginx/certs/${DOMAIN}.crt" || ! docker exec proxy test -s "/etc/nginx/certs/${DOMAIN}.key"; then
    echo "[wildcard-cert] Proxy certificate files are missing after sync; skipping reload"
    return 1
  fi

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
