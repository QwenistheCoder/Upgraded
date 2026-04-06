CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    host_id UUID REFERENCES users(id),
    config JSONB,
    status VARCHAR(20) DEFAULT 'PENDING',
    standings JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
