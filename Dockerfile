ARG GO_VERSION=1.23
ARG NODE_VERSION=18

FROM node:${NODE_VERSION}-slim AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM golang:${GO_VERSION}-bookworm AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
COPY --from=frontend /app/dist ./dist
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux BUILD_ARGS='-ldflags="-w -s"' \
    make build

FROM gcr.io/distroless/static-debian12
COPY --from=backend /app/bin/main /app/main
COPY --from=frontend /app/dist /app/dist
WORKDIR /app
EXPOSE 8080
ENV PORT=8080
CMD ["/app/main"]
