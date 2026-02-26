#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-${DOMAIN:-sbc.om}}"
HOST_TO_TEST="${2:-spirithub.${DOMAIN}}"
IP="${3:-${TARGET_IP:-}}"

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required" >&2
  exit 1
fi

if [[ -z "$IP" ]]; then
  IP="$(getent hosts "$DOMAIN" | awk '{print $1}' | head -n1 || true)"
fi

if [[ -z "$IP" ]]; then
  echo "Could not resolve IP for ${DOMAIN}" >&2
  exit 2
fi

SAN_OUTPUT="$(echo | openssl s_client -servername "$HOST_TO_TEST" -connect "${IP}:443" 2>/dev/null | openssl x509 -noout -ext subjectAltName 2>/dev/null || true)"

if [[ -z "$SAN_OUTPUT" ]]; then
  echo "Failed to read certificate SAN from ${HOST_TO_TEST} (${IP})" >&2
  exit 3
fi

echo "$SAN_OUTPUT"

if [[ "$SAN_OUTPUT" != *"DNS:*.${DOMAIN}"* ]]; then
  echo "Missing wildcard SAN DNS:*.${DOMAIN}" >&2
  exit 4
fi

echo "Wildcard SAN verification passed for *.${DOMAIN}"
