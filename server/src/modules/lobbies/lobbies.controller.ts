import { Request, Response, NextFunction } from "express";
import { LobbiesService, JoinInput } from "./lobbies.service";
import { getDb } from "../../config/database";
import { gameRegistry } from "../../scheduler/game-scheduler";
import { AgentConfig, GameStateDTO } from "@raisk/shared";

const lobbiesService = new LobbiesService(getDb()!);

export const listLobbies = (_req: Request, res: Response, _next: NextFunction) => {
  const lobbies = lobbiesService.listLobbies();
  return res.status(200).json(lobbies);
};

export const getLobby = (req: Request, res: Response, _next: NextFunction) => {
  const lobby = lobbiesService.getLobbyById(req.params.id as string);
  if (!lobby) return res.status(404).json({ error: "Lobby not found" });
  return res.status(200).json(lobby);
};

export const createLobby = (req: Request, res: Response, _next: NextFunction) => {
  const { name, config } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  const hostId = req.user?.id;
  const lobby = lobbiesService.createLobby({ name, host_id: hostId, config });
  return res.status(201).json(lobby);
};

export const joinLobby = (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id as string;
  const agent_config = req.body.agent_config as AgentConfig | undefined;

  if (!agent_config) {
    return res.status(400).json({ error: "agent_config is required" });
  }

  const joinInput: JoinInput = {
    user_id: req.user?.id,
    agent_config,
  };

  const lobby = lobbiesService.joinLobby(id, joinInput);
  if (!lobby) return res.status(400).json({ error: "Lobby not available or full" });
  return res.status(200).json(lobby);
};

export const joinByCode = (req: Request, res: Response, _next: NextFunction) => {
  const code = req.params.code as string;
  const agent_config = req.body.agent_config as AgentConfig | undefined;

  if (!agent_config) {
    return res.status(400).json({ error: "agent_config is required" });
  }

  const lobbyByCode = lobbiesService.getLobbyByCode(code.toUpperCase());
  if (!lobbyByCode) return res.status(404).json({ error: "Lobby not found" });

  const joinInput: JoinInput = {
    user_id: req.user?.id,
    agent_config,
  };

  const lobby = lobbiesService.joinLobby(lobbyByCode.id, joinInput);
  if (!lobby) return res.status(400).json({ error: "Failed to join lobby" });
  return res.status(200).json(lobby);
};

export const readyLobby = (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id as string;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Authentication required" });

  const lobby = lobbiesService.readyLobby(id, userId);
  if (!lobby) return res.status(404).json({ error: "Lobby not found" });
  return res.status(200).json(lobby);
};

export const leaveLobby = (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id as string;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Authentication required" });

  const lobby = lobbiesService.leaveLobby(id, userId);
  if (!lobby) return res.status(404).json({ error: "Lobby not found" });
  return res.status(200).json(lobby);
};

export const kickSlot = (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id as string;
  const slotId = req.params.slotId as string;
  const lobby = lobbiesService.kickSlot(id, slotId);
  if (!lobby) return res.status(404).json({ error: "Lobby not found" });
  return res.status(200).json(lobby);
};

export const startLobby = (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id as string;
  const result = lobbiesService.startLobby(id);

  if (!result) return res.status(400).json({ error: "Cannot start lobby: not ready or insufficient players" });

  const lobby = lobbiesService.getLobbyById(id);
  if (!lobby) return res.status(404).json({ error: "Lobby not found" });

  const slotsFilled = lobby.slots.filter(
    (s) => s.agent_config && s.agent_config.type !== "human",
  );

  const configObj = lobby.config as Record<string, unknown> | null;

  const config = {
    agents: slotsFilled.map((s) => s.agent_config as AgentConfig),
    move_delay_ms: Number(configObj?.move_delay_ms ?? 200),
    nukes_per_player: Number(configObj?.nukes_per_player ?? 0),
    max_turns: Number(configObj?.max_turns ?? 1000),
  };

  if (config.agents.length < 2) {
    return res.status(400).json({ error: "Need at least 2 agents to start" });
  }

  const engine = gameRegistry.create(config);
  return res.status(201).json({ gameId: engine.id, status: "started" });
};

export const streamLobby = (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id as string;
  const lobby = lobbiesService.getLobbyById(id);
  if (!lobby) return res.status(404).json({ error: "Lobby not found" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`event: lobby-update\ndata: ${JSON.stringify(lobby)}\n\n`);

  let lastState = JSON.stringify(lobby);

  const poll = setInterval(() => {
    try {
      const updated = lobbiesService.getLobbyById(id);
      if (!updated) {
        res.write("event: lobby-cancelled\ndata: {}\n\n");
        res.end();
        clearInterval(poll);
        return;
      }

      const newState = JSON.stringify(updated);
      if (newState !== lastState) {
        lastState = newState;
        res.write(`event: lobby-update\ndata: ${newState}\n\n`);
      }

      if (updated.status === "ACTIVE" || updated.status === "CANCELLED") {
        res.write(`event: lobby-${updated.status.toLowerCase()}\ndata: {}\n\n`);
        res.end();
        clearInterval(poll);
      }
    } catch {
      // Ignore polling errors
    }
  }, 1000);

  req.on("close", () => {
    clearInterval(poll);
  });
};
