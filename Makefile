BIN := $(PWD)/bin
GOFILES := $(shell find . -type f -name "*.go")

all: build test

$(BIN)/sqlc:
	GOBIN=$(BIN) go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

SQLCFILES := internal/sqldb/queries.sql.go internal/sqldb/models.go internal/sqldb/db.go
SQLCSRC := $(wildcard db/*.sql)
$(SQLCFILES): $(BIN)/sqlc db/schema.sql $(SQLCSRC) sqlc.yaml
	$(BIN)/sqlc generate

.PHONY: sqlc
sqlc: $(SQLCFILES)

.PHONY: migration
migration:
	touch db/migrate/$(shell date +%s)_$(NAME).sql

DBNAME=postgres
db/schema.sql:
	pg_dump --no-owner --no-acl --no-comments --schema-only --dbname=$(DBNAME) > db/schema.sql

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
