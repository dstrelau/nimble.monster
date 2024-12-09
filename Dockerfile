ARG GO_VERSION=1.23
FROM golang:${GO_VERSION}-bookworm AS builder

WORKDIR /usr/src/app
RUN mkdir -p /usr/src/app/bin

RUN GOBIN=/usr/src/app/bin go install github.com/a-h/templ/cmd/templ@latest
RUN GOBIN=/usr/src/app/bin go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
RUN curl -sL https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-linux-x64 \
    -o /usr/src/app/bin/tailwindcss && chmod +x /usr/src/app/bin/tailwindcss

COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN make build BUILD_ARGS='-ldflags="-w -s"'

FROM debian:bookworm
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates
COPY --from=builder /usr/src/app/main /usr/local/bin/
CMD ["main"]
