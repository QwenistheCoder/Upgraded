CREATE TABLE IF NOT EXISTS custom_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    base_url VARCHAR(500) NOT NULL,
    api_key_encrypted TEXT,
    api_key_header VARCHAR(100) DEFAULT 'Authorization',
    default_model VARCHAR(100),
    extra_headers JSONB DEFAULT '{}',
    protocol VARCHAR(20) DEFAULT 'openai',
    created_at TIMESTAMPTZ DEFAULT now()
);
