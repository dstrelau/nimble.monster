BIN := $(PWD)/bin
GOFILES := $(shell find . -type f -name "*.go")
TEMPLS := $(shell find . -type f -name "*.templ")
TEMPLGOS := $(TEMPLS:%.templ=%_templ.go)

all: build test

$(BIN)/sqlc:
	GOBIN=$(BIN) go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

$(BIN)/templ:
	GOBIN=$(BIN) go install github.com/a-h/templ/cmd/templ@latest

$(BIN)/tailwindcss:
	if [ "$$(uname)" = "Darwin" ]; then \
		curl -sL https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-macos-x64 -o $(BIN)/tailwindcss; \
	else \
		curl -sL https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-linux-x64 -o $(BIN)/tailwindcss; \
	fi
	chmod +x $(BIN)/tailwindcss

$(TEMPLGOS): %_templ.go: $(BIN)/templ %.templ
	$(BIN)/templ generate

.PHONY: templs
templs: $(TEMPLGOS)

web/assets/css/output.css: $(TEMPLS) web/assets/css/input.css $(BIN)/tailwindcss
	$(BIN)/tailwindcss -i web/assets/css/input.css -o web/assets/css/output.css

SQLCFILES := internal/sqldb/query.sql.go internal/sqldb/models.go internal/sqldb/db.go
SQLCSRC := $(wildcard internal/sqldb/*.sql)
$(SQLCFILES): $(BIN)/sqlc $(SQLCSRC) internal/sqldb/sqlc.yaml
	cd internal/sqldb && $(BIN)/sqlc generate

.PHONY: sqlc
sqlc: $(SQLCFILES)

main: $(GOFILES)
	go build -o main cmd/main.go

build: sqlc $(TEMPLGOS) web/assets/css/output.css main

run: build
	./main

.PHONY: test
test:
	go test ./... -v

.PHONY: clean
clean:
	rm -f main

.PHONY: watch
watch: $(BIN)/air
	air

$(BIN)/air:
    GOBIN=$(BIN) go install github.com/air-verse/air@latest; \
