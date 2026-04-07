import Database from "better-sqlite3";
import crypto from "crypto";
const uuidv4 = () => crypto.randomUUID();

import { AgentConfig } from "@raisk/shared";

export interface LobbyRow {
  id: string;
  code: string;
  name: string;
  host_id: string | null;
  status: "WAITING" | "ACTIVE" | "CANCELLED";
  config: string | null;
  created_at: string;
}

export interface LobbyWithSlots {
  id: string;
  code: string;
  name: string;
  host_id: string | null;
  status: "WAITING" | "ACTIVE" | "CANCELLED";
  config: Record<string, unknown> | null;
  created_at: string;
  slots: LobbySlot[];
}

export interface LobbySlot {
  id: string;
  lobby_id: string;
  slot_index: number;
  agent_config: AgentConfig | null;
  user_id: string | null;
  ready: boolean;
}

export interface CreateLobbyInput {
  name: string;
  host_id?: string;
  config?: Record<string, unknown>;
}

export interface JoinInput {
  user_id?: string;
  agent_config: AgentConfig;
}

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 8);
}

function parseSlots(slots: LobbySlot[]): LobbySlot[] {
  return slots.map((s) => ({
    ...s,
    agent_config: typeof s.agent_config === "string" ? JSON.parse(s.agent_config) : s.agent_config,
    ready: Boolean(s.ready),
  }));
}

function parseLobby(lobby: LobbyRow): LobbyWithSlots {
  let config: Record<string, unknown> | null = null;
  if (lobby.config) {
    try { config = JSON.parse(lobby.config); } catch { /* ignore */ }
  }
  return { ...lobby, slots: [], config };
}

export class LobbiesService {
  constructor(private db: Database.Database) {}

  listLobbies(): LobbyWithSlots[] {
    const lobbies = this.db.prepare(
      `SELECT id, code, name, host_id, status, config, created_at
       FROM lobbies WHERE status != 'ACTIVE' ORDER BY created_at DESC`,
    ).all() as LobbyRow[];

    return lobbies.map((lobby) => {
      const slots = this.db.prepare(
        `SELECT id, lobby_id, slot_index, agent_config, user_id, ready
         FROM lobby_slots WHERE lobby_id = ? ORDER BY slot_index`,
      ).all(lobby.id) as LobbySlot[];
      return { ...parseLobby(lobby), slots: parseSlots(slots) };
    });
  }

  getLobbyById(lobbyId: string): LobbyWithSlots | null {
    const lobby = this.db.prepare(
      `SELECT id, code, name, host_id, status, config, created_at
       FROM lobbies WHERE id = ?`,
    ).get(lobbyId) as LobbyRow | undefined;
    if (!lobby) return null;

    const slots = this.db.prepare(
      `SELECT id, lobby_id, slot_index, agent_config, user_id, ready
       FROM lobby_slots WHERE lobby_id = ? ORDER BY slot_index`,
    ).all(lobbyId) as LobbySlot[];
    return { ...parseLobby(lobby), slots: parseSlots(slots) };
  }

  getLobbyByCode(code: string): LobbyWithSlots | null {
    const lobby = this.db.prepare(
      `SELECT id, code, name, host_id, status, config, created_at
       FROM lobbies WHERE code = ? AND status = 'WAITING'`,
    ).get(code) as LobbyRow | undefined;
    if (!lobby) return null;

    const slots = this.db.prepare(
      `SELECT id, lobby_id, slot_index, agent_config, user_id, ready
       FROM lobby_slots WHERE lobby_id = ? ORDER BY slot_index`,
    ).all(lobby.id) as LobbySlot[];
    return { ...parseLobby(lobby), slots: parseSlots(slots) };
  }

  createLobby(input: CreateLobbyInput): LobbyWithSlots {
    const code = generateCode();

    const lobby = this.db.prepare(
      `INSERT INTO lobbies (id, code, name, host_id, config)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, code, name, host_id, status, config, created_at`,
    ).get(uuidv4(), code, input.name, input.host_id ?? null, JSON.stringify(input.config ?? {})) as LobbyRow;

    // Create 6 default slots (standard Risk player count)
    for (let i = 0; i < 6; i++) {
      this.db.prepare(
        `INSERT INTO lobby_slots (id, lobby_id, slot_index, agent_config)
         VALUES (?, ?, ?, ?)`,
      ).run(uuidv4(), lobby.id, i, JSON.stringify({ type: "human" as const }));
    }

    const slots = this.db.prepare(
      `SELECT id, lobby_id, slot_index, agent_config, user_id, ready
       FROM lobby_slots WHERE lobby_id = ? ORDER BY slot_index`,
    ).all(lobby.id) as LobbySlot[];

    return { ...parseLobby(lobby), slots: parseSlots(slots) };
  }

  joinLobby(lobbyId: string, input: JoinInput): LobbyWithSlots | null {
    const lobby = this.getLobbyById(lobbyId);
    if (!lobby || lobby.status !== "WAITING") return null;

    const configJson = JSON.stringify(input.agent_config);

    // Try to fill an empty slot (agent_config is default "human" and no user assigned)
    let changes = this.db.prepare(
      `UPDATE lobby_slots
       SET agent_config = ?, user_id = ?
       WHERE lobby_id = ?
         AND user_id IS NULL
         AND agent_config = ?
       LIMIT 1`,
    ).run(configJson, input.user_id ?? null, lobbyId, '{"type":"human"}').changes;

    if (changes === 0) {
      // Try to fill a slot that has no user_id
      changes = this.db.prepare(
        `UPDATE lobby_slots
         SET user_id = ?
         WHERE lobby_id = ? AND user_id IS NULL
         LIMIT 1`,
      ).run(input.user_id ?? null, lobbyId).changes;
    }

    if (changes === 0) return null;
    return this.getLobbyById(lobbyId);
  }

  readyLobby(lobbyId: string, userId: string): LobbyWithSlots | null {
    this.db.prepare(
      "UPDATE lobby_slots SET ready = NOT ready WHERE lobby_id = ? AND user_id = ?",
    ).run(lobbyId, userId);
    return this.getLobbyById(lobbyId);
  }

  leaveLobby(lobbyId: string, userId: string): LobbyWithSlots | null {
    this.db.prepare(
      `UPDATE lobby_slots SET user_id = NULL, agent_config = ?, ready = 0
       WHERE lobby_id = ? AND user_id = ?`,
    ).run(JSON.stringify({ type: "human" }), lobbyId, userId);
    return this.getLobbyById(lobbyId);
  }

  kickSlot(lobbyId: string, slotId: string): LobbyWithSlots | null {
    this.db.prepare(
      `UPDATE lobby_slots SET user_id = NULL, agent_config = ?, ready = 0
       WHERE id = ? AND lobby_id = ?`,
    ).run(JSON.stringify({ type: "human" }), slotId, lobbyId);
    return this.getLobbyById(lobbyId);
  }

  startLobby(lobbyId: string): { gameId: string; config: unknown } | null {
    const lobby = this.getLobbyById(lobbyId);
    if (!lobby) return null;
    if (lobby.status !== "WAITING") return null;

    const rows = this.db.prepare(
      `SELECT slot_index, agent_config FROM lobby_slots
       WHERE lobby_id = ? ORDER BY slot_index`,
    ).all(lobbyId) as { agent_config: string }[];

    // Get agents from all filled slots
    const agents = rows
      .filter((r) => r.agent_config && JSON.parse(r.agent_config).type !== "human")
      .map((r) => JSON.parse(r.agent_config) as AgentConfig);

    if (agents.length < 2) return null;

    const lobbyConfig = lobby.config ?? {};
    const gameConfig = {
      agents,
      seed: lobbyConfig.seed as number | undefined,
      move_delay_ms: lobbyConfig.move_delay_ms as number | undefined,
      nukes_per_player: (lobbyConfig.nukes_per_player as number) ?? 0,
      max_turns: (lobbyConfig.max_turns as number) ?? 1000,
    };

    // Update lobby status
    this.db.prepare(
      "UPDATE lobbies SET status = ? WHERE id = ?",
    ).run("ACTIVE", lobbyId);

    return { gameId: lobbyId, config: gameConfig };
  }

  deleteLobby(lobbyId: string): void {
    this.db.prepare("DELETE FROM lobbies WHERE id = ?").run(lobbyId);
  }
}
