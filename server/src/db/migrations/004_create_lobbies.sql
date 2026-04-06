CREATE TABLE IF NOT EXISTS lobbies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(8) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    host_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'WAITING',
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lobby_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID REFERENCES lobbies(id),
    slot_index INTEGER,
    agent_config JSONB NOT NULL,
    user_id UUID REFERENCES users(id),
    ready BOOLEAN DEFAULT false
);
