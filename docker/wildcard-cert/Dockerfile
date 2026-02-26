FROM python:3.12-alpine

RUN apk add --no-cache bash docker-cli && \
	pip install --no-cache-dir certbot certbot-dns-cloudflare

COPY scripts/wildcard-cert-daemon.sh /usr/local/bin/wildcard-cert-daemon.sh
RUN chmod +x /usr/local/bin/wildcard-cert-daemon.sh

ENTRYPOINT ["/usr/local/bin/wildcard-cert-daemon.sh"]
