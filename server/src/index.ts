import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { gameRegistry } from "./scheduler/game-scheduler";

import authRouter from "./modules/auth/auth.routes";
import usersRouter from "./modules/users/users.routes";
import gamesRouter from "./modules/games/games.routes";
import lobbiesRouter from "./modules/lobbies/lobbies.routes";
import tournamentsRouter from "./modules/tournaments/tournaments.routes";
import leaderboardRouter from "./modules/leaderboard/leaderboard.routes";
import adminRouter from "./modules/admin/admin.routes";
import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", games: gameRegistry.games.size });
});

// Route modules
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/games", gamesRouter);
app.use("/api/lobbies", lobbiesRouter);
app.use("/api/tournaments", tournamentsRouter);
app.use("/api", leaderboardRouter);
app.use("/api/admin", adminRouter);

// SSE game stream
app.get("/api/games/:id/stream", (req, res) => {
  const instance = gameRegistry.games.get(req.params.id);
  if (!instance) return res.status(404).json({ error: "Game not found" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const data = instance.engine.getState();
  res.write(`event: game-state\ndata: ${JSON.stringify(data)}\n\n`);

  const handler = (event: { event: string; data: any }) => {
    res.write(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`);
    if (event.event === "game-end") res.end();
  };

  instance.subscribers.add(handler);

  req.on("close", () => {
    instance.subscribers.delete(handler);
  });
});

app.use(errorHandler);

const port = parseInt(env.PORT, 10);
app.listen(port, () => {
  console.log(`RaiSK Upgraded server running on http://localhost:${port}`);
});

export default app;
