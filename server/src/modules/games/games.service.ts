import Database from "better-sqlite3";
import { gameRegistry } from "../../scheduler/game-scheduler";
import { GameStateDTO, ActionDTO } from "@raisk/shared";

export interface GameSummary {
  id: string;
  status: string;
  config: string | null;
  turn_count: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  active: boolean;
}

export interface GameDetail extends GameSummary {
  final_state: string | null;
  winner_ids: string | null;
  players?: GamePlayerSummary[];
}

export interface GamePlayerSummary {
  id: string;
  slot_index: number;
  agent_type: string;
  user_id: string | null;
  eliminated: boolean;
  final_position: number | null;
  elo_before: number | null;
  elo_after: number | null;
}

export interface SnapshotRecord {
  id: string;
  sequence_number: number;
  state: GameStateDTO;
  action: ActionDTO | null;
  created_at: string;
}

export interface ListGamesParams {
  limit?: number;
  offset?: number;
  status?: string;
}

export class GamesService {
  constructor(private db: Database.Database) {}

  listGames(params: ListGamesParams = {}): { games: GameSummary[]; total: number } {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    if (params.status) {
      const countRow = this.db.prepare(
        `SELECT COUNT(*) AS total FROM games WHERE status = ?`,
      ).get(params.status) as { total: number };

      const rows = this.db.prepare(
        `SELECT id, status, config, turn_count, started_at, ended_at, created_at
         FROM games WHERE status = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
      ).all(params.status, limit, offset) as GameSummary[];

      const games = rows.map((row) => ({
        ...row,
        active: gameRegistry.get(row.id) !== undefined,
      }));

      return { games, total: countRow.total };
    }

    const countRow = this.db.prepare(
      `SELECT COUNT(*) AS total FROM games`,
    ).get() as { total: number };

    const rows = this.db.prepare(
      `SELECT id, status, config, turn_count, started_at, ended_at, created_at
       FROM games
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
    ).all(limit, offset) as GameSummary[];

    const games = rows.map((row) => ({
      ...row,
      active: gameRegistry.get(row.id) !== undefined,
    }));

    return { games, total: countRow.total };
  }

  getGameById(gameId: string): GameDetail | null {
    const row = this.db.prepare(
      `SELECT id, status, config, final_state, winner_ids, turn_count,
              started_at, ended_at, created_at
       FROM games WHERE id = ?`,
    ).get(gameId) as GameDetail | undefined;

    if (!row) return null;

    const players = this.db.prepare(
      `SELECT id, slot_index, agent_type, user_id, eliminated,
              final_position, elo_before, elo_after
       FROM game_players WHERE game_id = ? ORDER BY slot_index`,
    ).all(gameId) as GamePlayerSummary[];

    return {
      ...row,
      active: gameRegistry.get(row.id) !== undefined,
      players,
    };
  }

  cancelGame(gameId: string): boolean {
    // Stop the active game engine if running
    const instance = gameRegistry.get(gameId);
    if (instance) {
      instance.engine.stop();
    }

    const result = this.db.prepare(
      `UPDATE games SET status = 'CANCELLED', ended_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'RUNNING' RETURNING id`,
    ).get(gameId);
    return result !== undefined;
  }

  getSnapshots(gameId: string): SnapshotRecord[] {
    const rows = this.db.prepare(
      `SELECT id, sequence_number, state, action, created_at
       FROM game_snapshots
       WHERE game_id = ?
       ORDER BY sequence_number ASC`,
    ).all(gameId) as SnapshotRecord[];

    return rows.map((r) => ({
      ...r,
      state: typeof r.state === "string" ? JSON.parse(r.state) : r.state,
      action: typeof r.action === "string" ? JSON.parse(r.action) : r.action,
    }));
  }

  saveSnapshot(gameId: string, sequenceNumber: number, state: GameStateDTO, action: ActionDTO | null): void {
    this.db.prepare(
      `INSERT INTO game_snapshots (game_id, sequence_number, state, action)
       VALUES (?, ?, ?, ?)`,
    ).run(gameId, sequenceNumber, JSON.stringify(state), JSON.stringify(action));
  }

  submitAction(
    gameId: string,
    playerId: string,
    action: ActionDTO,
  ): GameStateDTO | null {
    const instance = gameRegistry.get(gameId);
    if (!instance) return null;

    const result = instance.engine.processAction(action, playerId);
    return result;
  }
}
