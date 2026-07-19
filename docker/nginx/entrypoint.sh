#!/bin/sh
# ─── ConnectWorld Nginx Entrypoint ──────────────────────────────────────────
# Automatically detects whether Let's Encrypt SSL certificates exist and
# starts nginx with the appropriate configuration.
#
# Behavior:
#   - Certificates found       → Starts with full HTTPS config (nginx.conf)
#   - Certificates not found   → Starts with HTTP-only init config (nginx-init.conf)
#                               for ACME challenge bootstrapping

set -e

DOMAIN="${DOMAIN:-connectworld.app}"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
CERT_FILE="${CERT_DIR}/fullchain.pem"

# ─── Check for existing SSL certificates ────────────────────────────────────
if [ -f "$CERT_FILE" ]; then
    echo "✅ SSL certificates found for ${DOMAIN}"
    echo "   Starting with full HTTPS configuration..."

    exec nginx -c /etc/nginx/nginx.conf -g "daemon off;"
else
    echo "🔴 SSL certificates not found for ${DOMAIN}"
    echo "   Starting in HTTP-only initialization mode on port 80..."
    echo ""
    echo "   ┌─────────────────────────────────────────────────────────┐"
    echo "   │ To obtain SSL certificates, run one of these commands: │"
    echo "   │                                                         │"
    echo "   │   bash scripts/setup-ssl.sh                              │"
    echo "   │                                                         │"
    echo "   │   or manually:                                           │"
    echo "   │   docker compose run --rm certbot-init                   │"
    echo "   │   docker compose restart nginx-proxy                     │"
    echo "   └─────────────────────────────────────────────────────────┘"
    echo ""

    exec nginx -c /etc/nginx/nginx-init.conf -g "daemon off;"
fi
