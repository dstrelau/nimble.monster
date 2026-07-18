.PHONY: setup seed db-from-prod sync-icons sync-paperforge paperforge-catalog check fix lint type-check

BIN := node_modules/.bin

setup: node_modules db/dev.db sync-icons
	DATABASE_URL=file:db/dev.db pnpm run db:migrate
	DATABASE_URL=file:db/dev.db pnpm run db:seed
	@echo "Setup complete"

# Re-seed official content into the dev DB. Idempotent.
seed: | node_modules
	DATABASE_URL=file:db/dev.db pnpm run db:seed

node_modules: package.json pnpm-lock.yaml
	pnpm install
	@touch node_modules

db:
	mkdir -p db

# Fresh, empty dev DB; `make setup` migrates and seeds it. For prod data
# instead, run `make db-from-prod`.
db/dev.db: | db node_modules
	@rm -f db/dev.db-shm db/dev.db-wal
	touch db/dev.db

# Pull production data (requires fly access). Overwrites the local dev DB.
db-from-prod: | db node_modules
	@rm -f db/dev.db db/dev.db-shm db/dev.db-wal
	fly sftp get /data/db.sqlite db/dev.db
	DATABASE_URL=file:db/dev.db pnpm run db:migrate

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

fix: | node_modules
	$(BIN)/biome check --write --unsafe .

lint: | node_modules
	$(BIN)/biome check .

type-check: | node_modules
	$(BIN)/tsc --noEmit
