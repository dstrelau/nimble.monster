CREATE TYPE family_visibility AS ENUM (
    'public',
    'secret',
    'private'
);

CREATE TABLE families (
    id uuid DEFAULT uuid_generate_v4() NOT NULL UNIQUE,
    user_id uuid NOT NULL,
    visibility family_visibility DEFAULT 'public'::family_visibility NOT NULL,
    name text NOT NULL,
    abilities jsonb[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE monsters
ADD COLUMN family_id uuid REFERENCES families(id);
