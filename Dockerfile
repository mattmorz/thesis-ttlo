# Stage 1: Base image with libc6-compat for Alpine compatibility
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat curl

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Stage 3: Build application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public

# Set production environment for build optimization
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgres://postgres:postgres@localhost:5432/build_db_placeholder"
ENV AUTH_SECRET="build_secret_key_for_static_generation_32_bytes"

RUN npm run build
RUN npx esbuild src/drizzle/migrate.ts --bundle --platform=node --target=node20 --outfile=dist/migrate.js

# Stage 4: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Install curl for Docker healthcheck
RUN apk add --no-cache curl

# Create unprivileged system group & user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets, migration runner, and standalone server bundle
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist/migrate.js ./dist/migrate.js
COPY --from=builder /app/src/drizzle/migrations ./src/drizzle/migrations
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create persistent storage directories for uploads
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
