#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <host> <ip>"
  echo "Example: $0 spirithub.sbc.om 95.111.227.198"
  exit 1
fi

host="$1"
ip="$2"

echo "== DNS (system resolver) =="
getent hosts "$host" || true

echo

echo "== DNS (public resolvers) =="
nslookup "$host" 1.1.1.1 || true
nslookup "$host" 8.8.8.8 || true

echo

echo "== HTTPS probe with explicit resolve =="
curl -I -m 20 --resolve "$host:443:$ip" "https://$host" || true

echo

echo "== Certificate SAN check =="
echo | openssl s_client -servername "$host" -connect "$ip:443" 2>/dev/null | openssl x509 -noout -subject -issuer -ext subjectAltName || true
