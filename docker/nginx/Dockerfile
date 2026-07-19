# ─── ConnectWorld Nginx Reverse Proxy ────────────────────────────────────────
# Handles SSL termination, routes traffic to internal services.
# Uses a smart entrypoint that starts in HTTP-only mode until Let's Encrypt
# certificates are obtained, then switches to full HTTPS.

FROM nginx:1.27-alpine

# Install certbot and openssl for SSL
RUN apk add --no-cache certbot openssl

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy nginx configurations
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-init.conf /etc/nginx/nginx-init.conf

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create ACME challenge directory
RUN mkdir -p /var/www/certbot

# Generate Diffie-Hellman parameters for SSL (build-time, one-time cost)
RUN openssl dhparam -out /etc/nginx/dhparam.pem 2048

# Create nginx cache directories
RUN mkdir -p /var/cache/nginx /var/log/nginx

EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]
