import { Router } from "express";
import {
  getLeaderboard,
  compareRatings,
  getRecentChanges,
  getConfigModels,
  getConfigProviders,
} from "./leaderboard.controller";

const router = Router();

router.get("/", getLeaderboard);
router.get("/compare", compareRatings);
router.get("/recent", getRecentChanges);
router.get("/config/models", getConfigModels);
router.get("/config/providers", getConfigProviders);

export default router;
