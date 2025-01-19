BIN := $(PWD)/bin
GOFILES := $(shell find . -type f -name "*.go")

all: build test

$(BIN)/sqlc:
	GOBIN=$(BIN) go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

SQLCFILES := internal/sqldb/query.sql.go internal/sqldb/models.go internal/sqldb/db.go
SQLCSRC := $(wildcard internal/sqldb/*.sql)
$(SQLCFILES): $(BIN)/sqlc $(SQLCSRC) internal/sqldb/sqlc.yaml
	cd internal/sqldb && $(BIN)/sqlc generate

.PHONY: sqlc
sqlc: $(SQLCFILES)

$(BIN)/main: $(GOFILES)
	go build -o $(BIN)/main ${BUILD_ARGS} cmd/main.go

build: sqlc $(BIN)/main

.PHONY: run
run: $(BIN)/main
	$(BIN)/main

.PHONY: test
test:
	go test ./... -v

.PHONY: clean
clean:
	rm -f $(BIN)/main

.PHONY: watch
watch: $(BIN)/air
	air

$(BIN)/air:
    GOBIN=$(BIN) go install github.com/air-verse/air@latest; \
