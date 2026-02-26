#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-sbc.om}"
EMAIL="${LETSENCRYPT_EMAIL:-admin@${DOMAIN}}"
TOKEN="${CLOUDFLARE_API_TOKEN:-}"
INTERVAL_HOURS="${CERT_RENEW_INTERVAL_HOURS:-12}"
SELF_CONTAINER_REF="${HOSTNAME:-sbc-wildcard-cert}"

mount_spec_for() {
  local container_name="$1"
  local destination="$2"
  local info type name source
  info="$(docker inspect -f "{{range .Mounts}}{{if eq .Destination \"${destination}\"}}{{.Type}}|{{.Name}}|{{.Source}}{{end}}{{end}}" "$container_name" 2>/dev/null || true)"
  if [[ -z "$info" ]]; then
    return 1
  fi

  IFS='|' read -r type name source <<< "$info"
  if [[ "$type" == "volume" && -n "$name" ]]; then
    printf "%s" "$name"
    return 0
  fi

  if [[ "$type" == "bind" && -n "$source" ]]; then
    printf "%s" "$source"
    return 0
  fi

  return 1
}

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

  # Sync cert files from wildcard-cert ACME mount into proxy cert mount via helper container.
  local acme_mount proxy_certs_mount helper
  acme_mount="$(mount_spec_for "$SELF_CONTAINER_REF" "/etc/letsencrypt" || true)"
  proxy_certs_mount="$(mount_spec_for "proxy" "/etc/nginx/certs" || true)"

  if [[ -z "$acme_mount" || -z "$proxy_certs_mount" ]]; then
    echo "[wildcard-cert] Could not detect required mounts (acme/proxy-certs); skipping sync"
    return 1
  fi

  helper="$(docker create \
    -v "${acme_mount}:/acme:ro" \
    -v "${proxy_certs_mount}:/proxy-certs" \
    alpine:3.21 \
    sh -lc "cp -L /acme/live/${DOMAIN}/fullchain.pem /proxy-certs/${DOMAIN}.crt && cp -L /acme/live/${DOMAIN}/privkey.pem /proxy-certs/${DOMAIN}.key")"
  docker start -a "$helper" >/dev/null
  docker rm -f "$helper" >/dev/null 2>&1 || true
  echo "[wildcard-cert] Synced certificate into proxy mount: ${proxy_certs_mount}"

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
