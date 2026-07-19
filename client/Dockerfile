# ─── Build Stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy source code and configs
COPY tsconfig.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src/ ./src/
COPY public/ ./public/

# Build the application
RUN npm run build

# ─── Production Stage (Nginx) ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Install healthcheck tool
RUN apk add --no-cache wget

# Copy nginx configuration (from client directory, relative to build context)
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Set permissions for the nginx user (already exists in the base image)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user (nginx user already exists in the base image)
USER nginx

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
