.PHONY: setup sync-icons sync-paperforge paperforge-catalog check lint type-check

BIN := node_modules/.bin

setup: node_modules db/dev.db sync-icons
	DATABASE_URL=file:db/dev.db pnpm run db:migrate
	@echo "Setup complete"

node_modules: package.json pnpm-lock.yaml
	pnpm install
	@touch node_modules

db:
	mkdir -p db

TURSO := $(shell command -v turso 2>/dev/null || echo ~/.turso/turso)

db/dev.db: | db node_modules
	@if $(TURSO) db list 2>/dev/null | grep -q nexus-production; then \
		echo "Exporting production database..."; \
		rm -f db/dev.db db/dev.db-shm db/dev.db-wal; \
		$(TURSO) db export nexus-production --output-file db/dev.db; \
	else \
		echo "Creating empty database..."; \
		DATABASE_URL=file:db/dev.db $(BIN)/drizzle-kit migrate; \
	fi

sync-icons: components/game-icons/index.ts

assets/game-icons:
	git submodule update --init assets/game-icons

components/game-icons/index.ts: | assets/game-icons
	node tools/sync-icons.js

sync-paperforge:
	node tools/paperforge.ts all

paperforge-catalog:
	node tools/paperforge.ts scrape

check: lint type-check

lint: | node_modules
	$(BIN)/biome check .

type-check: | node_modules
	$(BIN)/tsc --noEmit
