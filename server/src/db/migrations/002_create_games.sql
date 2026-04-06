CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID,
    tournament_id UUID,
    tournament_game_number INTEGER,
    status VARCHAR(20) DEFAULT 'RUNNING',
    config JSONB NOT NULL,
    final_state JSONB,
    winner_ids TEXT[],
    seed INTEGER,
    move_delay_ms INTEGER DEFAULT 500,
    nukes_per_player INTEGER DEFAULT 0,
    max_turns INTEGER DEFAULT 1000,
    turn_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_games_status_created ON games(status, created_at DESC);

CREATE TABLE IF NOT EXISTS game_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id),
    slot_index INTEGER,
    agent_type VARCHAR(50),
    agent_config JSONB,
    user_id UUID REFERENCES users(id),
    eliminated BOOLEAN DEFAULT false,
    final_position INTEGER,
    elo_before INTEGER,
    elo_after INTEGER
);
