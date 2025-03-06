CREATE TYPE family_visibility AS ENUM (
    'public',
    'secret',
    'private'
);

CREATE TABLE families (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    visibility family_visibility DEFAULT 'public'::family_visibility NOT NULL,
    name text NOT NULL,
    abilities jsonb[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
