DROP INDEX idx_users_discord_id;

ALTER TABLE monsters
DROP CONSTRAINT IF EXISTS monsters_family_id_fkey;

ALTER TABLE families
DROP CONSTRAINT IF EXISTS families_id_key;

ALTER TABLE families ADD CONSTRAINT families_pkey PRIMARY KEY (id);

ALTER TABLE monsters ADD CONSTRAINT monsters_family_id_fkey FOREIGN KEY (family_id) REFERENCES families (id);

ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id);
