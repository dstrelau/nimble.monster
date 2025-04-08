ARG GO_VERSION=1.23
ARG NODE_VERSION=18

FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update && apt-get install -y \
    ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS frontend
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run deploy

FROM golang:${GO_VERSION}-bookworm AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux BUILD_ARGS='-ldflags="-w -s"' \
    make build

FROM base
WORKDIR /app
COPY --from=frontend --chown=node:node /app/.next/standalone .next/standalone
COPY --from=backend /app/bin/main /app/main
COPY --chmod=755 start.js /app/
EXPOSE 3000 3000
CMD ["node", "start.js"]
