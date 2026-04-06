import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
  listTournaments,
  createTournament,
  getTournament,
  getTournamentGames,
  getTournamentStats,
} from "./tournaments.controller";

const router = Router();

router.get("/", listTournaments);
router.post("/", requireAuth, createTournament);
router.get("/:id", getTournament);
router.get("/:id/games", getTournamentGames);
router.get("/:id/stats", getTournamentStats);

export default router;
