import Database from "better-sqlite3";
import { AgentConfig } from "@raisk/shared";

export interface Tournament {
  id: string;
  name: string;
  host_id: string | null;
  config: Record<string, unknown> | null;
  status: "PENDING" | "RUNNING" | "COMPLETE" | "CANCELLED";
  standings: Record<string, unknown>[] | null;
  created_at: string;
}

export interface TournamentGame {
  id: string;
  tournament_game_number: number;
  status: string;
  config: string | null;
  final_state: string | null;
  winner_ids: string | null;
  started_at: string | null;
  ended_at: string | null;
}

export interface CreateTournamentInput {
  name: string;
  host_id?: string;
  agents: AgentConfig[];
  games_per_matchup: number;
  seed?: number;
  move_delay_ms?: number;
  nukes_per_player?: number;
  max_turns?: number;
}

export interface TournamentStats {
  totalGames: number;
  completedGames: number;
  runningGames: number;
  totalPlayers: number;
  averageGameDuration: number | null;
  topPlayers: { agent_type: string; wins: number }[];
}

export class TournamentsService {
  constructor(private db: Database.Database) {}

  listTournaments(): Tournament[] {
    const rows = this.db.prepare(
      `SELECT id, name, host_id, config, status, standings, created_at
       FROM tournaments ORDER BY created_at DESC`,
    ).all() as Tournament[];
    return rows.map((r) => parseTournamentConfig(r));
  }

  getTournament(id: string): Tournament | null {
    const row = this.db.prepare(
      `SELECT id, name, host_id, config, status, standings, created_at
       FROM tournaments WHERE id = ?`,
    ).get(id) as Tournament | undefined;
    return row ? parseTournamentConfig(row) : null;
  }

  createTournament(input: CreateTournamentInput): Tournament {
    const config = {
      agents: input.agents,
      games_per_matchup: input.games_per_matchup,
      seed: input.seed,
      move_delay_ms: input.move_delay_ms,
      nukes_per_player: input.nukes_per_player,
      max_turns: input.max_turns,
    };

    const row = this.db.prepare(
      `INSERT INTO tournaments (id, name, host_id, config, status)
       VALUES (?, ?, ?, 'PENDING')
       RETURNING id, name, host_id, config, status, standings, created_at`,
    ).get(input.name, input.host_id ?? null, JSON.stringify(config)) as Tournament;
    return parseTournamentConfig(row);
  }

  getTournamentGames(id: string): TournamentGame[] {
    return this.db.prepare(
      `SELECT id, tournament_game_number, status, config, final_state,
              winner_ids, started_at, ended_at
       FROM games WHERE tournament_id = ? ORDER BY tournament_game_number`,
    ).all(id) as TournamentGame[];
  }

  getTournamentStats(id: string): TournamentStats | null {
    const tournament = this.getTournament(id);
    if (!tournament) return null;

    const statsRow = this.db.prepare(
      `SELECT
         COUNT(*) AS totalGames,
         SUM(CASE WHEN status = 'COMPLETE' THEN 1 ELSE 0 END) AS completedGames,
         SUM(CASE WHEN status = 'RUNNING' THEN 1 ELSE 0 END) AS runningGames,
         AVG(julianday(ended_at) - julianday(started_at)) * 86400 AS averageGameDuration
       FROM games WHERE tournament_id = ?`,
    ).get(id) as Record<string, number | null> | undefined;

    const playerRows = this.db.prepare(
      `SELECT
         json_extract(gp.agent_config, '$.type') AS agent_type,
         SUM(CASE WHEN gp.final_position = 1 THEN 1 ELSE 0 END) AS wins
       FROM games g
       JOIN game_players gp ON g.id = gp.game_id
       WHERE g.tournament_id = ?
       GROUP BY agent_type
       ORDER BY wins DESC
       LIMIT 10`,
    ).all(id) as { agent_type: string; wins: number }[];

    const playersCountResult = this.db.prepare(
      `SELECT COUNT(DISTINCT gp.slot_index) AS totalPlayers
       FROM games g
       JOIN game_players gp ON g.id = gp.game_id
       WHERE g.tournament_id = ?`,
    ).get(id) as { totalPlayers: number } | undefined;

    return {
      totalGames: statsRow?.totalGames ?? 0,
      completedGames: statsRow?.completedGames ?? 0,
      runningGames: statsRow?.runningGames ?? 0,
      totalPlayers: playersCountResult?.totalPlayers ?? 0,
      averageGameDuration: statsRow?.averageGameDuration ?? null,
      topPlayers: playerRows.map((r) => ({ agent_type: r.agent_type, wins: r.wins })),
    };
  }
}

function parseTournamentConfig(row: Tournament): Tournament {
  if (typeof row.config === "string") {
    try { row.config = JSON.parse(row.config); } catch { /* ignore */ }
  }
  if (typeof row.standings === "string") {
    try { row.standings = JSON.parse(row.standings); } catch { /* ignore */ }
  }
  return row;
}
