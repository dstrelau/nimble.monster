.PHONY: setup sync-icons sync-paperforge check lint type-check

BIN := node_modules/.bin

setup: node_modules db/dev.db sync-icons
	@echo "Setup complete"

node_modules: package.json pnpm-lock.yaml
	pnpm install
	@touch node_modules

db:
	mkdir -p db

db/dev.db: | db node_modules
	@if command -v turso >/dev/null && turso db list 2>/dev/null | grep -q nexus-production; then \
		echo "Exporting production database..."; \
		turso db export nexus-production --output-file db/dev.db; \
	else \
		echo "Creating empty database..."; \
		$(BIN)/drizzle-kit push; \
	fi

sync-icons: components/game-icons/index.ts

assets/game-icons: | assets
	git clone https://github.com/game-icons/icons.git assets/game-icons

components/game-icons/index.ts: assets/game-icons
	node tools/sync-icons.js

sync-paperforge:
	node tools/sync-paperforge.ts

check: lint type-check

lint: | node_modules
	$(BIN)/biome check .

type-check: | node_modules
	$(BIN)/tsc --noEmit
