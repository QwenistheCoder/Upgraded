import Database from "better-sqlite3";

export interface RatingEntry {
  id: string;
  entity_key: string;
  entity_type: string;
  entity_sub_type: string | null;
  elo: number;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  updated_at: string;
}

export interface RatingChange {
  entity_key: string;
  entity_type: string;
  elo_before: number;
  elo_after: number;
  game_id: string;
  changed_at: string;
}

export interface CompareResult {
  entities: { entity_key: string; entity_type: string; elo: number; games_played: number; wins: number }[];
}

// Built-in model list by provider
const BUILTIN_MODELS: Record<string, string[]> = {
  anthropic: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
  openai: ["gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
  xai: ["grok-3", "grok-3-mini"],
  google: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
  mistral: ["mistral-large-2411", "mistral-small-2402", "codestral-2501"],
  cohere: ["command-r-plus", "command-r", "command-light"],
  groq: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"],
  together: ["meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", "mistralai/Mixtral-8x22B-Instruct-v0.1"],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  openrouter: ["anthropic/claude-sonnet-4", "openai/gpt-4.1", "meta-llama/llama-3.3-70b-instruct"],
};

const PROTOCOL_MAP: Record<string, string> = {
  anthropic: "anthropic",
  openai: "openai",
  xai: "openai",
  google: "openai",
  mistral: "openai",
  cohere: "openai",
  groq: "openai",
  together: "openai",
  deepseek: "openai",
  openrouter: "openai",
};

export class LeaderboardService {
  constructor(private db: Database.Database) {}

  getLeaderboard(
    entityType?: string,
    limit = 50,
    offset = 0,
  ): { entries: RatingEntry[]; total: number } {
    if (entityType) {
      const countRow = this.db.prepare(
        `SELECT COUNT(*) AS total FROM ratings WHERE entity_type = ?`,
      ).get(entityType) as { total: number };

      const entries = this.db.prepare(
        `SELECT id, entity_key, entity_type, entity_sub_type, elo, games_played, wins, losses, draws, updated_at
         FROM ratings WHERE entity_type = ?
         ORDER BY elo DESC
         LIMIT ? OFFSET ?`,
      ).all(entityType, limit, offset) as RatingEntry[];

      return { entries, total: countRow.total };
    }

    const countRow = this.db.prepare(
      `SELECT COUNT(*) AS total FROM ratings`,
    ).get() as { total: number };

    const entries = this.db.prepare(
      `SELECT id, entity_key, entity_type, entity_sub_type, elo, games_played, wins, losses, draws, updated_at
       FROM ratings
       ORDER BY elo DESC
       LIMIT ? OFFSET ?`,
    ).all(limit, offset) as RatingEntry[];

    return { entries, total: countRow.total };
  }

  compareRatings(entityKey1: string, entityKey2: string): CompareResult | null {
    const rows = this.db.prepare(
      `SELECT entity_key, entity_type, elo, games_played, wins, losses, draws
       FROM ratings
       WHERE entity_key = ? OR entity_key = ?`,
    ).all(entityKey1, entityKey2) as Record<string, unknown>[];

    if (rows.length === 0) return null;

    return {
      entities: rows.map((r) => ({
        entity_key: r.entity_key as string,
        entity_type: r.entity_type as string,
        elo: r.elo as number,
        games_played: r.games_played as number,
        wins: r.wins as number,
      })),
    };
  }

  getRecentChanges(limit = 20): RatingEntry[] {
    return this.db.prepare(
      `SELECT id, entity_key, entity_type, entity_sub_type, elo, games_played, wins, losses, draws, updated_at
       FROM ratings ORDER BY updated_at DESC LIMIT ?`,
    ).all(limit) as RatingEntry[];
  }

  getBuiltinModels(): Record<string, { models: string[]; protocol: string }> {
    const result: Record<string, { models: string[]; protocol: string }> = {};
    for (const [provider, models] of Object.entries(BUILTIN_MODELS)) {
      result[provider] = {
        models,
        protocol: PROTOCOL_MAP[provider] ?? "openai",
      };
    }
    return result;
  }

  getBuiltinProviders(): { id: string; name: string; protocol: string }[] {
    const NAMES: Record<string, string> = {
      anthropic: "Anthropic",
      openai: "OpenAI",
      xai: "xAI",
      google: "Google AI",
      mistral: "Mistral AI",
      cohere: "Cohere",
      groq: "Groq",
      together: "Together AI",
      deepseek: "DeepSeek",
      openrouter: "OpenRouter",
    };

    return Object.keys(BUILTIN_MODELS).map((id) => ({
      id,
      name: NAMES[id] ?? id,
      protocol: PROTOCOL_MAP[id] ?? "openai",
    }));
  }
}
