import { Router } from "express";
import { requireAdmin } from "./admin.middleware";
import {
  getDashboard,
  listUsers,
  promoteUser,
  demoteUser,
  assignBadge,
  removeBadge,
  verifyEmail,
  unverifyEmail,
  getActiveGames,
  getGameHistory,
  deleteGame,
} from "./admin.controller";

const router = Router();

// All admin routes require admin
router.use(requireAdmin);

// Dashboard
router.get("/dashboard", getDashboard);

// User management
router.get("/users", listUsers);
router.post("/users/:id/promote", promoteUser);
router.post("/users/:id/demote", demoteUser);
router.post("/users/:id/badges", assignBadge);
router.delete("/users/:id/badges/:badgeId", removeBadge);
router.post("/users/:id/verify-email", verifyEmail);
router.post("/users/:id/unverify-email", unverifyEmail);

// Game management
router.get("/games/active", getActiveGames);
router.get("/games/history", getGameHistory);
router.delete("/games/:id", deleteGame);

export default router;
