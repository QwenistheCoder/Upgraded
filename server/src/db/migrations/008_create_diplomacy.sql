CREATE TABLE IF NOT EXISTS diplomacy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id),
    player1_id UUID REFERENCES game_players(id),
    player2_id UUID REFERENCES game_players(id),
    status VARCHAR(30) DEFAULT 'proposed',
    end_reason VARCHAR(30),
    proposed_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ
);
