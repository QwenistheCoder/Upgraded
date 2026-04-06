CREATE TABLE IF NOT EXISTS game_snapshots (
    id BIGSERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    state JSONB NOT NULL,
    action JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_snapshots_game_seq ON game_snapshots(game_id, sequence_number);
