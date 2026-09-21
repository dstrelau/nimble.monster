FROM node:24-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && corepack install && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_PUBLIC_BUCKET_NAME=nimble-nexus
RUN corepack enable && corepack install && node tools/sync-icons.js && pnpm run build

FROM base AS app-runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/tools/set-feature-flag.mjs /app/set-feature-flag.mjs
RUN chmod +x /app/set-feature-flag.mjs \
    && ln -s /app/set-feature-flag.mjs /usr/local/bin/set-feature-flag \
    && mkdir -p .next/cache \
    && chown -R node:node .next
EXPOSE 3000

FROM app-runtime AS runner
RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=litestream/litestream:0.3.13 /usr/local/bin/litestream /usr/local/bin/litestream
COPY litestream.yml /etc/litestream.yml
USER node
CMD ["litestream", "replicate", "-exec", "node server.js"]
