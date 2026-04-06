import { Router } from "express";
import {
  listLobbies,
  getLobby,
  createLobby,
  joinLobby,
  joinByCode,
  readyLobby,
  leaveLobby,
  kickSlot,
  startLobby,
  streamLobby,
} from "./lobbies.controller";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

router.get("/", listLobbies);
router.post("/", requireAuth, createLobby);
router.get("/:id", getLobby);
router.get("/:id/stream", streamLobby);
router.post("/:id/start", requireAuth, startLobby);
router.post("/:id/join", requireAuth, joinLobby);
router.post("/join/:code", joinByCode);
router.post("/:id/ready", requireAuth, readyLobby);
router.post("/:id/leave", requireAuth, leaveLobby);
router.delete("/:id/slots/:slotId/kick", requireAuth, kickSlot);

export default router;
