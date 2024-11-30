ARG GO_VERSION=1
FROM golang:${GO_VERSION}-bookworm AS builder

WORKDIR /usr/src/app
RUN mkdir -p /usr/src/app/bin

RUN GOBIN=/usr/src/app/bin go install github.com/a-h/templ/cmd/templ@latest
RUN GOBIN=/usr/src/app/bin go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
RUN curl -sL https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-linux-x64 \
    -o /usr/src/app/bin/tailwindcss && chmod +x /usr/src/app/bin/tailwindcss

COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download && go mod verify
COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    make build

FROM debian:bookworm
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates
COPY --from=builder /usr/src/app/main /usr/local/bin/
CMD ["main"]
