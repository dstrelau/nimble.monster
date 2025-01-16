CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE size_type AS ENUM ('tiny', 'small', 'medium', 'large', 'huge', 'gargantuan');
CREATE TYPE armor_type AS ENUM ('none', 'medium', 'heavy');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discord_id TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    avatar TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);

CREATE TABLE IF NOT EXISTS monsters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  hp INTEGER NOT NULL,
  armor armor_type NOT NULL DEFAULT 'none',
  size size_type NOT NULL DEFAULT 'medium',
  speed INTEGER NOT NULL DEFAULT 6,
  fly INTEGER NOT NULL DEFAULT 0,
  swim INTEGER NOT NULL DEFAULT 0,
  actions JSONB[],
  abilities JSONB[],
  legendary BOOLEAN DEFAULT false,
  bloodied TEXT,
  last_stand TEXT,
  saves TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_monsters_user_id ON monsters(user_id);

CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);

CREATE TABLE IF NOT EXISTS monsters_collections (
    monster_id UUID NOT NULL REFERENCES monsters(id),
    collection_id UUID NOT NULL REFERENCES collections(id),
    PRIMARY KEY (monster_id, collection_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    discord_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
