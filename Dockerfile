# ──────────────────────────────────────────────
# Stage 1: Install dependencies
# ──────────────────────────────────────────────
ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS deps
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    pkgconf \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    pixman-dev
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lock files first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --unsafe-perm
RUN npm_config_build_from_source=true pnpm rebuild --unsafe-perm
RUN find /app/node_modules -name canvas.node -type f | head -1 | grep -q . \
    && echo '✓ canvas.node binary found' || (echo '✗ canvas.node NOT found — listing .pnpm:' && ls -R /app/node_modules/.pnpm/canvas* 2>/dev/null && exit 1)

# ──────────────────────────────────────────────
# Stage 2: Build the application
# ──────────────────────────────────────────────
FROM ${NODE_IMAGE} AS builder
WORKDIR /app

RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    pkgconf \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    pixman-dev

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN find node_modules -name canvas.node -type f | head -1 | grep -q . \
    && echo '✓ canvas.node in builder: OK' || (echo '✗ canvas.node NOT found in builder' && exit 1)

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build arguments for NEXT_PUBLIC variables (must be set at build time)
# Only variables actually read via process.env.NEXT_PUBLIC_* in src/ are needed here.
ARG NEXT_PUBLIC_SITE_URL=https://sbc.om
ARG NEXT_PUBLIC_API_URL=https://sbc.om
ARG NEXT_PUBLIC_SOCIAL_FACEBOOK
ARG NEXT_PUBLIC_SOCIAL_TWITTER

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCIAL_FACEBOOK=$NEXT_PUBLIC_SOCIAL_FACEBOOK
ENV NEXT_PUBLIC_SOCIAL_TWITTER=$NEXT_PUBLIC_SOCIAL_TWITTER

# Build Next.js (produces .next/standalone with output: "standalone")
RUN pnpm build

# Stage native modules that the standalone output may not trace through pnpm symlinks
# Use find to locate the actual pnpm store paths (avoids glob issues in sh)
RUN mkdir -p /runtime-modules && \
    CANVAS_DIR=$(find node_modules/.pnpm -path '*/canvas@*/node_modules/canvas' -maxdepth 4 -type d | head -1) && \
    SBC_DIR=$(find node_modules/.pnpm -path '*/sbcwallet@*/node_modules/sbcwallet' -maxdepth 4 -type d | head -1) && \
    cp -rL "$CANVAS_DIR" /runtime-modules/canvas && \
    cp -rL "$SBC_DIR" /runtime-modules/sbcwallet && \
    echo "✓ runtime modules staged (canvas=$CANVAS_DIR, sbcwallet=$SBC_DIR)"

# ──────────────────────────────────────────────
# Stage 3: Production runner (minimal image)
# ──────────────────────────────────────────────
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime OS deps (sharp needs vips on Alpine)
RUN apk add --no-cache \
    libc6-compat \
    vips-dev \
    cairo \
    pango \
    jpeg \
    giflib \
    pixman \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy sharp from node_modules for image optimization
COPY --from=builder /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder /app/node_modules/@img ./node_modules/@img

# Copy native modules (sbcwallet + canvas) that pnpm symlinks may prevent standalone from tracing
COPY --from=builder /runtime-modules/canvas ./node_modules/canvas
COPY --from=builder /runtime-modules/sbcwallet ./node_modules/sbcwallet

# Create directories for persistent data (will be mounted as volumes)
RUN mkdir -p \
    /app/public/uploads /app/data /app/logs /app/backups /app/certs /app/.next/cache \
    && chown -R nextjs:nodejs \
    /app/public/uploads /app/data /app/logs /app/backups /app/certs /app/.next/cache /app/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -q --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
