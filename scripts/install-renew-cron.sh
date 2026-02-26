#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_EXPR="${CRON_EXPR:-17 3 * * *}"
CMD="cd $ROOT_DIR && DOMAIN=${DOMAIN:-sbc.om} LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL:-admin@sbc.om} CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN:-} $ROOT_DIR/scripts/provision-wildcard-cert.sh >> $ROOT_DIR/SERVER/.certbot/renew.log 2>&1"

( crontab -l 2>/dev/null | grep -v 'provision-wildcard-cert.sh' || true; echo "$CRON_EXPR $CMD" ) | crontab -

echo "Installed cron renewal job: $CRON_EXPR"
