import { Request, Response, NextFunction } from "express";
import { getDb } from "../../config/database";
import { gameRegistry } from "../../scheduler/game-scheduler";
import { ActionDTO, AgentConfig, GameConfig } from "@raisk/shared";

export const listGames = async (_req: Request, res: Response) => {
  const games = [];
  for (const [id, instance] of gameRegistry.games) {
    const state = instance.engine.getState();
    games.push({
      id,
      state,
      config: instance.engine.getConfig(),
      active: true,
    });
  }
  return res.status(200).json(games);
};

export const getGame = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const instance = gameRegistry.games.get(id);
  if (instance) {
    return res.status(200).json({
      id: instance.id,
      state: instance.engine.getState(),
      config: instance.engine.getConfig(),
      active: true,
    });
  }

  return res.status(404).json({ error: "Game not found" });
};

export const cancelGame = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const instance = gameRegistry.games.get(id);
  if (!instance) return res.status(404).json({ error: "Game not found" });

  instance.engine.stop();
  gameRegistry.games.delete(id);
  return res.status(200).json({ message: "Game cancelled" });
};

export const getSnapshots = async (_req: Request, res: Response) => {
  return res.status(200).json([]);
};

export const submitAction = async (req: Request, res: Response) => {
  const gameId = req.params.id as string;
  const playerId = req.params.id2 as string;
  const action = req.body as ActionDTO;

  const instance = gameRegistry.games.get(gameId);
  if (!instance) return res.status(404).json({ error: "Game not found" });

  const result = instance.engine.processAction(action, playerId);
  if (!result) return res.status(400).json({ error: "Invalid action" });
  return res.status(200).json(result);
};

export const createGame = (req: Request, res: Response, next: NextFunction) => {
  const body = req.body as {
    agents: AgentConfig[];
    seed?: number;
    move_delay_ms?: number;
    nukes_per_player?: number;
    max_turns?: number;
  };

  const { agents, seed, move_delay_ms, nukes_per_player, max_turns } = body;

  if (!agents || !Array.isArray(agents) || agents.length < 2 || agents.length > 6) {
    return res.status(400).json({ error: "Need 2-6 agent configs" });
  }

  const config: GameConfig = {
    agents,
    seed,
    move_delay_ms: move_delay_ms ?? 200,
    nukes_per_player: nukes_per_player ?? 0,
    max_turns: max_turns ?? 1000,
  };

  try {
    const engine = gameRegistry.create(config);

    // Persist to DB if available (optional)
    const db = getDb();
    if (db) {
      try {
        db.prepare(
          `INSERT INTO games (id, status, config, seed, move_delay_ms, nukes_per_player, max_turns, started_at)
           VALUES (?, 'RUNNING', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        ).run(engine.id, JSON.stringify(config), config.seed ?? null, config.move_delay_ms, config.nukes_per_player, config.max_turns);
        for (let i = 0; i < agents.length; i++) {
          db.prepare(
            `INSERT INTO game_players (id, game_id, slot_index, agent_type, agent_config)
             VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?)`,
          ).run(engine.id, i, agents[i].type, JSON.stringify(agents[i]));
        }
      } catch {
        // DB write failed but game still works in-memory
      }
    }

    return res.status(201).json({ id: engine.id, status: "created" });
  } catch (err) {
    return next(err);
  }
};

export const streamGame = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const instance = gameRegistry.games.get(id);

  if (!instance) return res.status(404).json({ error: "Game not found or not active" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const data = instance.engine.getState();
  res.write(`event: game-state\ndata: ${JSON.stringify(data)}\n\n`);

  const handler = (event: { event: string; data: unknown }) => {
    res.write(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`);
    if (event.event === "game-end") res.end();
  };

  instance.subscribers.add(handler);

  req.on("close", () => {
    instance.subscribers.delete(handler);
  });
};
