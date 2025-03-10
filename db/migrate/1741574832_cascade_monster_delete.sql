ALTER TABLE monsters_collections
DROP CONSTRAINT monsters_collections_monster_id_fkey,
ADD CONSTRAINT monsters_collections_monster_id_fkey FOREIGN KEY (monster_id) REFERENCES monsters (id) ON DELETE CASCADE;
