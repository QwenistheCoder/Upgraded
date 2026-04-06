CREATE TABLE IF NOT EXISTS ratings (
    id BIGSERIAL PRIMARY KEY,
    entity_key VARCHAR(200) NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    entity_sub_type VARCHAR(50),
    elo INTEGER DEFAULT 1000,
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ratings_elo ON ratings(elo DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_entity ON ratings(entity_key, entity_type);
