import { Request, Response, NextFunction } from "express";
import { LeaderboardService } from "./leaderboard.service";
import { getDb } from "../../config/database";

const leaderboardService = new LeaderboardService(getDb()!);

export const getLeaderboard = (req: Request, res: Response, _next: NextFunction) => {
  const entityType = req.query.type as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
  const offset = Math.max(parseInt(req.query.offset as string, 10) || 0, 0);

  const { entries, total } = leaderboardService.getLeaderboard(entityType, limit, offset);
  return res.status(200).json({ entries, total, limit, offset });
};

export const compareRatings = (req: Request, res: Response, _next: NextFunction) => {
  const { entity1, entity2 } = req.query;
  if (!entity1 || !entity2) {
    return res.status(400).json({ error: "entity1 and entity2 query parameters are required" });
  }
  const result = leaderboardService.compareRatings(entity1 as string, entity2 as string);
  if (!result) return res.status(404).json({ error: "One or both entities not found" });
  return res.status(200).json(result);
};

export const getRecentChanges = (req: Request, res: Response, _next: NextFunction) => {
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
  const changes = leaderboardService.getRecentChanges(limit);
  return res.status(200).json(changes);
};

export const getConfigModels = (req: Request, res: Response, _next: NextFunction) => {
  const models = leaderboardService.getBuiltinModels();
  return res.status(200).json(models);
};

export const getConfigProviders = (req: Request, res: Response, _next: NextFunction) => {
  const providers = leaderboardService.getBuiltinProviders();
  return res.status(200).json(providers);
};
