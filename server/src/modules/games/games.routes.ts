import { Router } from "express";
import {
  listGames,
  getGame,
  cancelGame,
  getSnapshots,
  submitAction,
  createGame,
  streamGame,
} from "./games.controller";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

router.get("/", listGames);
router.post("/", createGame);
router.get("/:id", getGame);
router.delete("/:id", requireAuth, cancelGame);
router.get("/:id/stream", streamGame);
router.get("/:id/snapshots", getSnapshots);
router.post("/:id/players/:id2/action", submitAction);

export default router;
