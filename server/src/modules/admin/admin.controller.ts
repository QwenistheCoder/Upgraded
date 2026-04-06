import { Request, Response, NextFunction } from "express";
import { getDb } from "../../config/database";
import { gameRegistry } from "../../scheduler/game-scheduler";

// -- Dashboard --

export const getDashboard = (_req: Request, res: Response, _next: NextFunction) => {
  const db = getDb();
  if (!db) {
    return res.status(200).json({
      userCount: 0,
      totalGames: 0,
      activeGames: 0,
      inMemoryGames: gameRegistry.size,
      tournamentCount: 0,
      lobbyCount: 0,
    });
  }

  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  const gameCount = db.prepare("SELECT COUNT(*) AS count FROM games").get() as { count: number };
  const activeGameCount = db.prepare("SELECT COUNT(*) AS count FROM games WHERE status = 'RUNNING'").get() as { count: number };
  const tournamentCount = db.prepare("SELECT COUNT(*) AS count FROM tournaments").get() as { count: number };
  const lobbyCount = db.prepare("SELECT COUNT(*) AS count FROM lobbies WHERE status = 'WAITING'").get() as { count: number };

  return res.status(200).json({
    userCount: userCount.count,
    totalGames: gameCount.count,
    activeGames: activeGameCount.count,
    inMemoryGames: gameRegistry.size,
    tournamentCount: tournamentCount.count,
    lobbyCount: lobbyCount.count,
  });
};

// -- Users --

export const listUsers = (req: Request, res: Response, _next: NextFunction) => {
  const db = getDb();
  if (!db) return res.status(200).json({ users: [], total: 0, limit: 50, offset: 0 });

  const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
  const offset = Math.max(parseInt(req.query.offset as string, 10) || 0, 0);
  const search = req.query.search as string | undefined;

  if (search) {
    const countRow = db.prepare(
      `SELECT COUNT(*) AS count FROM users WHERE username LIKE ? OR email LIKE ?`,
    ).get(`%${search}%`, `%${search}%`) as { count: number };

    const rows = db.prepare(
      `SELECT id, username, email, role, email_verified, elo_default, created_at
       FROM users WHERE username LIKE ? OR email LIKE ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
    ).all(`%${search}%`, `%${search}%`, limit, offset);

    return res.status(200).json({ users: rows, total: countRow.count, limit, offset });
  }

  const countRow = db.prepare(`SELECT COUNT(*) AS count FROM users`).get() as { count: number };
  const rows = db.prepare(
    `SELECT id, username, email, role, email_verified, elo_default, created_at
     FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  ).all(limit, offset);

  return res.status(200).json({ users: rows, total: countRow.count, limit, offset });
};

export const promoteUser = (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const db = getDb();
  if (!db) return res.status(404).json({ error: "Database not available" });
  const result = db.prepare(
    "UPDATE users SET role = 'admin' WHERE id = ? RETURNING id, username, role",
  ).get(id);
  if (!result) return res.status(404).json({ error: "User not found" });
  return res.status(200).json(result);
};

export const demoteUser = (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const db = getDb();
  if (!db) return res.status(404).json({ error: "Database not available" });
  const result = db.prepare(
    "UPDATE users SET role = 'user' WHERE id = ? RETURNING id, username, role",
  ).get(id);
  if (!result) return res.status(404).json({ error: "User not found" });
  return res.status(200).json(result);
};

export const assignBadge = (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const { badgeId } = req.body;

  if (!badgeId) {
    return res.status(400).json({ error: "badgeId is required" });
  }

  const db = getDb();
  if (!db) return res.status(404).json({ error: "Database not available" });
  const userResult = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
  if (!userResult) return res.status(404).json({ error: "User not found" });

  return res.status(200).json({ message: "Badge assigned", userId: id, badgeId });
};

export const removeBadge = (req: Request, res: Response, _next: NextFunction) => {
  const { id, badgeId } = req.params;
  return res.status(200).json({ message: "Badge removed", userId: id, badgeId });
};

export const verifyEmail = (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const db = getDb();
  if (!db) return res.status(404).json({ error: "Database not available" });
  const result = db.prepare(
    "UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ? RETURNING id, email_verified",
  ).get(id);
  if (!result) return res.status(404).json({ error: "User not found" });
  return res.status(200).json({ message: "Email verified", ...result });
};

export const unverifyEmail = (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const db = getDb();
  if (!db) return res.status(404).json({ error: "Database not available" });
  const result = db.prepare(
    "UPDATE users SET email_verified = 0 WHERE id = ? RETURNING id, email_verified",
  ).get(id);
  if (!result) return res.status(404).json({ error: "User not found" });
  return res.status(200).json({ message: "Email unverified", ...result });
};

// -- Games --

export const getActiveGames = (_req: Request, res: Response, _next: NextFunction) => {
  const db = getDb();
  if (!db) return res.status(200).json([]);
  const rows = db.prepare(
    `SELECT id, status, config, turn_count, started_at, created_at
     FROM games WHERE status = 'RUNNING' ORDER BY created_at DESC`,
  ).all() as Record<string, unknown>[];

  const games = rows.map((row) => ({
    ...row,
    inMemory: gameRegistry.get(row.id as string) !== undefined,
  }));

  return res.status(200).json(games);
};

export const getGameHistory = (req: Request, res: Response, _next: NextFunction) => {
  const db = getDb();
  if (!db) return res.status(200).json({ games: [], total: 0, limit: 50, offset: 0 });

  const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
  const offset = Math.max(parseInt(req.query.offset as string, 10) || 0, 0);

  const countRow = db.prepare(
    "SELECT COUNT(*) AS count FROM games WHERE status != 'RUNNING'",
  ).get() as { count: number };

  const rows = db.prepare(
    `SELECT id, status, config, final_state, winner_ids, turn_count, started_at, ended_at, created_at
     FROM games WHERE status != 'RUNNING'
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
  ).all(limit, offset);

  return res.status(200).json({ games: rows, total: countRow.count, limit, offset });
};

export const deleteGame = (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const gameId = id as string;

  // Stop in-memory engine if active
  const instance = gameRegistry.get(gameId);
  if (instance) {
    instance.engine.stop();
    gameRegistry.delete(gameId);
  }

  const db = getDb();
  if (db) {
    db.prepare("DELETE FROM games WHERE id = ?").run(gameId);
  }
  return res.status(204).send();
};