# ──────────────────────────────────────────────
# Stage 1: Dependencies
# ──────────────────────────────────────────────
ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS deps
RUN apk add --no-cache libc6-compat python3 make g++ pkgconf \
    cairo-dev pango-dev jpeg-dev giflib-dev pixman-dev librsvg-dev
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Hoist packages so Next.js standalone can trace them through flat node_modules
# Force IPv4 to avoid ETIMEDOUT on servers with broken IPv6 routing
RUN echo "shamefully-hoist=true" > .npmrc
RUN NODE_OPTIONS="--dns-result-order=ipv4first" pnpm install --frozen-lockfile --unsafe-perm

# ──────────────────────────────────────────────
# Stage 2: Builder
# ──────────────────────────────────────────────
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_SITE_URL=https://sbc.om
ARG NEXT_PUBLIC_API_URL=https://sbc.om
ARG NEXT_PUBLIC_SOCIAL_FACEBOOK
ARG NEXT_PUBLIC_SOCIAL_TWITTER

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCIAL_FACEBOOK=$NEXT_PUBLIC_SOCIAL_FACEBOOK
ENV NEXT_PUBLIC_SOCIAL_TWITTER=$NEXT_PUBLIC_SOCIAL_TWITTER

RUN pnpm build

# ──────────────────────────────────────────────
# Stage 3: Runner
# ──────────────────────────────────────────────
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat cairo pango jpeg giflib pixman librsvg postgresql-client

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN mkdir -p /app/.data/uploads /app/data /app/logs /app/backups /app/certs /app/.next/cache \
    && chown -R nextjs:nodejs /app/.data/uploads /app/data /app/logs /app/backups /app/certs /app/.next/cache /app/public /app/.data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -q --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
