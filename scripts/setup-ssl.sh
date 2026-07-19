#!/bin/bash
# ─── ConnectWorld SSL Setup Script ──────────────────────────────────────────
# Automates the Let's Encrypt SSL certificate acquisition process.
#
# Usage:
#   bash scripts/setup-ssl.sh                    # Interactive mode (prompts for domain & email)
#   DOMAIN=example.com EMAIL=admin@example.com bash scripts/setup-ssl.sh  # Non-interactive
#
# Prerequisites:
#   1. Your domain's DNS A records must point to this server's public IP
#   2. Port 80 must be publicly accessible (for ACME challenge verification)
#
# Process:
#   1. Starts nginx-proxy in HTTP-only init mode
#   2. Runs certbot to obtain SSL certificates via webroot challenge
#   3. Restarts nginx-proxy with full HTTPS configuration

set -e

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m'

echo ""
echo "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo "${BLUE}║      ConnectWorld - Let's Encrypt SSL Setup             ║${NC}"
echo "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Configuration ──────────────────────────────────────────────────────────
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"

# Prompt for domain if not set
if [ -z "$DOMAIN" ]; then
    read -p "Enter your domain (e.g., connectworld.app): " DOMAIN
    while [ -z "$DOMAIN" ]; do
        echo "${RED}Domain is required.${NC}"
        read -p "Enter your domain: " DOMAIN
    done
fi

# Prompt for email if not set
if [ -z "$EMAIL" ]; then
    read -p "Enter your email address (for Let's Encrypt notifications): " EMAIL
    while [ -z "$EMAIL" ]; do
        echo "${RED}Email is required for Let's Encrypt.${NC}"
        read -p "Enter your email: " EMAIL
    done
fi

echo ""
echo "${BLUE}Configuration:${NC}"
echo "  Domain:       ${GREEN}$DOMAIN${NC}"
echo "  Wildcard:     ${GREEN}www.$DOMAIN${NC}"
echo "  Email:        ${GREEN}$EMAIL${NC}"
echo ""

# ─── Step 1: Ensure nginx-proxy is running ──────────────────────────────────
echo "${YELLOW}[1/4] Starting nginx-proxy in HTTP init mode...${NC}"

# Check if nginx-proxy container exists
if docker ps --format '{{.Names}}' | grep -q '^connectworld-nginx$'; then
    echo "   Nginx proxy is already running. Restarting..."
    docker compose restart nginx-proxy
else
    echo "   Starting nginx proxy service..."
    docker compose up -d nginx-proxy
fi

# Wait for nginx to be ready
sleep 3

# Verify nginx is accessible
if ! curl -s -o /dev/null -w '%{http_code}' http://localhost/health | grep -q '200'; then
    echo "${RED}✗ Nginx proxy is not responding on port 80.${NC}"
    echo "  Check: docker compose logs nginx-proxy"
    exit 1
fi
echo "   ${GREEN}✓ Nginx is running on port 80${NC}"

# ─── Step 2: Verify DNS resolution ──────────────────────────────────────────
echo ""
echo "${YELLOW}[2/4] Verifying DNS resolution for $DOMAIN...${NC}"

# Resolve the domain
PUBLIC_IP=$(curl -s https://api.ipify.org 2>/dev/null || curl -s https://ifconfig.me 2>/dev/null || echo "")
DOMAIN_IP=$(dig +short "$DOMAIN" 2>/dev/null || host "$DOMAIN" 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "")

if [ -n "$PUBLIC_IP" ] && [ -n "$DOMAIN_IP" ]; then
    if [ "$PUBLIC_IP" != "$DOMAIN_IP" ]; then
        echo "${YELLOW}  ⚠  Warning: $DOMAIN resolves to $DOMAIN_IP, but server IP is $PUBLIC_IP${NC}"
        echo "     Make sure your domain's DNS A record points to this server."
        echo ""
        read -p "  Continue anyway? [y/N] " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "${RED}Aborted.${NC}"
            exit 1
        fi
    else
        echo "   ${GREEN}✓ $DOMAIN resolves to $PUBLIC_IP (correct)${NC}"
    fi
else
    echo "   ${YELLOW}⚠  Skipping DNS check (dig/host not available)${NC}"
fi

# Verify domain is accessible on port 80
sleep 2
if curl -s -o /dev/null --max-time 5 "http://$DOMAIN/health" 2>/dev/null; then
    echo "   ${GREEN}✓ $DOMAIN:80 is accessible${NC}"
else
    echo "${YELLOW}  ⚠  Cannot reach http://$DOMAIN/health from this server.${NC}"
    echo "     The ACME challenge may fail if Let's Encrypt can't reach your server."
    echo ""
    read -p "  Continue anyway? [Y/n] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "${RED}Aborted.${NC}"
        exit 1
    fi
fi

# ─── Step 3: Obtain SSL certificates ────────────────────────────────────────
echo ""
echo "${YELLOW}[3/4] Obtaining Let's Encrypt SSL certificates...${NC}"
echo "   This may take 30-60 seconds..."

docker compose --profile init run --rm \
    -e DOMAIN="$DOMAIN" \
    -e EMAIL="$EMAIL" \
    certbot-init

# Check if certs were obtained
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
if docker exec connectworld-nginx test -f "$CERT_DIR/fullchain.pem" 2>/dev/null; then
    echo "   ${GREEN}✓ SSL certificates obtained successfully!${NC}"
else
    echo "${RED}✗ Failed to obtain SSL certificates.${NC}"
    echo "  Check the logs above for details."
    echo "  Common issues:"
    echo "    - DNS records don't point to this server"
    echo "    - Port 80 is blocked by a firewall"
    echo "    - Let's Encrypt rate limits exceeded"
    exit 1
fi

# ─── Step 4: Restart nginx with full SSL config ─────────────────────────────
echo ""
echo "${YELLOW}[4/4] Restarting nginx-proxy with full HTTPS configuration...${NC}"

docker compose up -d --force-recreate nginx-proxy
sleep 3

# Verify HTTPS is working
if curl -s -o /dev/null --max-time 5 "https://$DOMAIN/health" 2>/dev/null; then
    echo "   ${GREEN}✓ HTTPS is working on https://$DOMAIN${NC}"
elif curl -k -s -o /dev/null --max-time 5 "https://$DOMAIN/health" 2>/dev/null; then
    echo "   ${GREEN}✓ HTTPS is responding (certificate may be self-signed locally)${NC}"
else
    echo "${YELLOW}  ⚠  Could not verify HTTPS. Check: docker compose logs nginx-proxy${NC}"
fi

# ─── Success ────────────────────────────────────────────────────────────────
echo ""
echo "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo "${GREEN}║      SSL Setup Complete!                                ║${NC}"
echo "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  ${BLUE}HTTPS:${NC}  https://$DOMAIN"
echo "  ${BLUE}HTTP:${NC}   https://www.$DOMAIN"
echo ""
echo "  Your certificates will be automatically renewed every 12 hours"
echo "  by the 'certbot-renew' service."
echo ""
echo "  ${YELLOW}Next steps:${NC}"
echo "  1. Update OAuth callback URLs (Google & GitHub) to use your HTTPS domain"
  echo "  2. Update CLIENT_URL in .env to https://$DOMAIN"
  echo "  3. For production: remove client port 3000 mapping in docker-compose.yml"
  echo "     (prevents users from bypassing SSL by accessing port 3000 directly)"
  echo "  4. Run 'docker compose logs -f nginx-proxy' to monitor"
  echo ""
  echo "  ${GREEN}💡 Tip:${NC} Once you're committed to HTTPS-only, enable HSTS preload"
  echo "     by setting 'Strict-Transport-Security' to include 'preload' in"
  echo "     docker/nginx/nginx.conf and submitting to https://hstspreload.org"
echo ""
