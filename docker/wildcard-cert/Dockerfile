FROM docker:27-cli

RUN apk add --no-cache bash certbot py3-certbot-dns-cloudflare

COPY scripts/wildcard-cert-daemon.sh /usr/local/bin/wildcard-cert-daemon.sh
RUN chmod +x /usr/local/bin/wildcard-cert-daemon.sh

ENTRYPOINT ["/usr/local/bin/wildcard-cert-daemon.sh"]
