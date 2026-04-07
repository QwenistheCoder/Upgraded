import { existsSync, mkdirSync } from "node:fs";
import Database from "better-sqlite3";
import { env } from "./env";

let db: Database.Database | null = null;

export function getDb(): Database.Database | null {
  return db;
}

export function initDb(): Database.Database | null {
  if (db) return db;

  const dbPath = env.DATABASE_URL.startsWith("file:")
    ? env.DATABASE_URL.replace("file:", "")
    : env.DATABASE_URL.startsWith("sqlite:")
      ? env.DATABASE_URL.replace("sqlite:", "")
      : null;

  if (!dbPath) return null;

  try {
    const parentDir = dbPath.includes("/") ? dbPath.substring(0, dbPath.lastIndexOf("/")) : ".";
    if (parentDir && !existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    createTables(db);
    console.log(`SQLite database initialized at: ${dbPath}`);
    return db;
  } catch (err) {
    console.warn("Could not open SQLite database. Running without persistence:", (err as Error).message);
    return null;
  }
}

/**
 * Create all tables from the SQL migration files using SQLite-compatible DDL.
 */
function createTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      email_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      reset_token TEXT,
      avatar_url TEXT,
      elo_default INTEGER DEFAULT 1000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      lobby_id TEXT,
      tournament_id TEXT,
      tournament_game_number INTEGER,
      status TEXT DEFAULT 'RUNNING',
      config TEXT NOT NULL,
      final_state TEXT,
      winner_ids TEXT,
      seed INTEGER,
      move_delay_ms INTEGER DEFAULT 500,
      nukes_per_player INTEGER DEFAULT 0,
      max_turns INTEGER DEFAULT 1000,
      turn_count INTEGER DEFAULT 0,
      started_at DATETIME,
      ended_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS game_players (
      id TEXT PRIMARY KEY,
      game_id TEXT REFERENCES games(id),
      slot_index INTEGER,
      agent_type TEXT,
      agent_config TEXT,
      user_id TEXT REFERENCES users(id),
      eliminated INTEGER DEFAULT 0,
      final_position INTEGER,
      elo_before INTEGER,
      elo_after INTEGER
    );

    CREATE TABLE IF NOT EXISTS game_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
      sequence_number INTEGER NOT NULL,
      state TEXT NOT NULL,
      action TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_snapshots_game_seq ON game_snapshots(game_id, sequence_number);

    CREATE TABLE IF NOT EXISTS lobbies (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      host_id TEXT REFERENCES users(id),
      status TEXT DEFAULT 'WAITING',
      config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lobby_slots (
      id TEXT PRIMARY KEY,
      lobby_id TEXT REFERENCES lobbies(id),
      slot_index INTEGER,
      agent_config TEXT NOT NULL,
      user_id TEXT REFERENCES users(id),
      ready INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      host_id TEXT REFERENCES users(id),
      config TEXT,
      status TEXT DEFAULT 'PENDING',
      standings TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS diplomacy (
      id TEXT PRIMARY KEY,
      game_id TEXT REFERENCES games(id),
      player1_id TEXT REFERENCES game_players(id),
      player2_id TEXT REFERENCES game_players(id),
      status TEXT DEFAULT 'proposed',
      end_reason TEXT,
      proposed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_key TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_sub_type TEXT,
      elo INTEGER DEFAULT 1000,
      games_played INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_entity ON ratings(entity_key, entity_type);
    CREATE INDEX IF NOT EXISTS idx_ratings_elo ON ratings(elo DESC);

    CREATE TABLE IF NOT EXISTS custom_providers (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      api_key_encrypted TEXT,
      api_key_header TEXT DEFAULT 'Authorization',
      default_model TEXT,
      extra_headers TEXT DEFAULT '{}',
      protocol TEXT DEFAULT 'openai',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      encrypted_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Lazy init on import
initDb();

export { db };
