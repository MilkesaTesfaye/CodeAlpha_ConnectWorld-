# ─── Build Stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (dev deps needed for TypeScript build)
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source code
COPY prisma/ ./prisma/
COPY tsconfig.json ./
COPY src/ ./src/

# Generate Prisma client and build TypeScript
RUN npx prisma generate && \
    npm run build

# ─── Production Stage ────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Install netcat for database readiness check in entrypoint
RUN apk add --no-cache netcat-openbsd

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package.json and install only production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy built code from builder (seed files are compiled to dist/)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Generate Prisma client for production (needed for the generated client library)
RUN npx prisma generate --no-hints && \
    mkdir -p /app/logs && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start server via entrypoint (handles Prisma schema push + seeding)
ENTRYPOINT ["/docker-entrypoint.sh"]
