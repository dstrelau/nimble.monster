ARG GO_VERSION=1.23

FROM node:18-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM golang:${GO_VERSION}-bookworm AS backend
WORKDIR /app
RUN mkdir -p /app/bin
RUN GOBIN=/app/bin go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
COPY --from=frontend /app/dist ./dist
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux BUILD_ARGS='-ldflags="-w -s"' \
    make build

FROM debian:bookworm
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates
COPY --from=backend /app/bin/main /app/main
COPY --from=frontend /app/dist /app/dist

WORKDIR /app
EXPOSE 8080
ENV PORT=8080
CMD ["/app/main"]
