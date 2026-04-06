import { Request, Response, NextFunction } from "express";
import { TournamentsService } from "./tournaments.service";
import { getDb } from "../../config/database";

const tournamentsService = new TournamentsService(getDb()!);

export const listTournaments = (req: Request, res: Response, _next: NextFunction) => {
  const tournaments = tournamentsService.listTournaments();
  return res.status(200).json(tournaments);
};

export const createTournament = (req: Request, res: Response, _next: NextFunction) => {
  const { name, agents, games_per_matchup, seed, move_delay_ms, nukes_per_player, max_turns } = req.body;

  if (!name || !agents || !games_per_matchup) {
    return res.status(400).json({ error: "name, agents, and games_per_matchup are required" });
  }

  const hostId = req.user?.id;
  const tournament = tournamentsService.createTournament({
    name,
    host_id: hostId,
    agents,
    games_per_matchup,
    seed,
    move_delay_ms,
    nukes_per_player,
    max_turns,
  });

  return res.status(201).json(tournament);
};

export const getTournament = (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id as string;
  const tournament = tournamentsService.getTournament(id);
  if (!tournament) return res.status(404).json({ error: "Tournament not found" });
  return res.status(200).json(tournament);
};

export const getTournamentGames = (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id as string;
  const games = tournamentsService.getTournamentGames(id);
  return res.status(200).json(games);
};

export const getTournamentStats = (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id as string;
  const stats = tournamentsService.getTournamentStats(id);
  if (!stats) return res.status(404).json({ error: "Tournament not found" });
  return res.status(200).json(stats);
};
