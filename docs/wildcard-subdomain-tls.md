# Wildcard Subdomain TLS (sbc.om) for nginx-proxy

This guide enables `https://<business>.sbc.om` (for example `https://spirithub.sbc.om`) with valid TLS using a single command.

## Why this is needed

Your app routing already supports subdomains.
The current blocker is TLS: the server certificate only includes `sbc.om` and does **not** include `*.sbc.om`.

## Prerequisites

- DNS already configured:
  - `A sbc.om -> <server-ip>`
  - `CNAME *.sbc.om -> sbc.om` (or `A *.sbc.om -> <server-ip>`)
- Cloudflare DNS provider for `sbc.om`
- Docker + Docker Compose installed on server

## 1) Create Cloudflare API token

Create a token with these permissions (zone scoped to `sbc.om`):

- Zone:Read
- DNS:Edit

## 2) Set env and run one command

```bash
cp .env.production.example .env
# fill .env values (especially CLOUDFLARE_API_TOKEN and all CHANGE_ME)

docker compose up -d --build
```

The root `docker-compose.yml` now includes:

- `proxy` (nginx-proxy)
- `letsencrypt` (acme-companion for apex/www)
- `wildcard-cert` daemon (DNS-01 wildcard issuance + periodic renewal)
- `app`
- `postgres`

So a single `docker compose up -d` brings up full production stack.

## 3) Verify

```bash
dig +short spirithub.sbc.om
curl -I --resolve spirithub.sbc.om:443:95.111.227.198 https://spirithub.sbc.om
echo | openssl s_client -servername spirithub.sbc.om -connect 95.111.227.198:443 2>/dev/null | openssl x509 -noout -subject -ext subjectAltName
```

Expected certificate SAN includes at least:


- `DNS:sbc.om`
- `DNS:*.sbc.om`

Renewal is automatic via `wildcard-cert` service loop (default every 12h).

---

If DNS is correct but local machine still fails to resolve, flush local resolver cache or use a public DNS resolver temporarily.

## One-command automation (recommended)

You can make startup + wildcard TLS fully automatic with the included scripts:

```bash
cd /path/to/sbc
export DOMAIN=sbc.om
export LETSENCRYPT_EMAIL=admin@sbc.om
export CLOUDFLARE_API_TOKEN=YOUR_CLOUDFLARE_API_TOKEN

./scripts/start-production.sh
```

Optional pre-check only:

```bash
./scripts/validate-production-env.sh ./.env
```

What this does automatically:

0. Validates required `.env` values (including Cloudflare token and wildcard host)
1. Starts proxy stack (`SERVER/docker-compose.yml`)
2. Starts app stack (`docker-compose.yml`)
3. Issues/renews wildcard certificate (`sbc.om` + `*.sbc.om`) using DNS-01
4. Installs certificate into `proxy` and reloads nginx
5. Runs subdomain diagnostics

### Automatic periodic renewal

Install a daily cron job (idempotent):

```bash
cd /path/to/sbc
export DOMAIN=sbc.om
export LETSENCRYPT_EMAIL=admin@sbc.om
export CLOUDFLARE_API_TOKEN=YOUR_CLOUDFLARE_API_TOKEN

./scripts/install-renew-cron.sh
```

Optional custom cron expression:

```bash
CRON_EXPR="23 4 * * *" ./scripts/install-renew-cron.sh
```

Manual renewal/provision anytime:

```bash
./scripts/provision-wildcard-cert.sh
```
