import { getDb } from "../config/database";

const DEFAULT_ELO = 1000;

/**
 * Calculate expected score for a player given their rating vs opponent rating.
 */
function expectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * K-factor based on number of games played.
 * New players have higher K-factor to converge faster.
 */
function kFactor(gamesPlayed: number): number {
  if (gamesPlayed < 10) return 40;
  if (gamesPlayed < 30) return 30;
  if (gamesPlayed < 100) return 24;
  return 16;
}

/**
 * Update Elo rating for a player after a game.
 * score: 1 = win, 0.5 = draw, 0 = loss
 */
export function calculateNewElo(
  currentRating: number,
  expected: number,
  score: number,
  gamesPlayed: number,
): number {
  const k = kFactor(gamesPlayed);
  const newRating = currentRating + k * (score - expected);
  return Math.round(newRating);
}

export interface GameResult {
  entityId: string;
  entityType: string;
  subType?: string;
  position: number; // 1 = first place
}

export interface RatingResult {
  entityId: string;
  entityType: string;
  subType?: string;
  eloBefore: number;
  eloAfter: number;
}

/**
 * Update ratings for all players in a completed game.
 * Returns the list of updated ratings.
 */
export function updateRatings(gameId: string, results: GameResult[]): RatingResult[] {
  const db = getDb();
  if (!db) return [];
  if (results.length < 2) return [];

  const ratingResults: RatingResult[] = [];

  // For each player, calculate score based on positions
  // Position 1 = score near 1, last position = score near 0
  const positions = results.map((r) => r.position).filter((p) => p > 0);
  const maxPosition = positions.length > 0 ? Math.max(...positions) : results.length;

  for (const result of results) {
    // Normalize position to a score: 1st = 1.0, last = 0.0
    let score: number;
    if (result.position === 1 && results.filter((r) => r.position === 1).length === 1) {
      score = 1.0;
    } else if (result.position === maxPosition) {
      score = 0.0;
    } else {
      score = 0.5; // Middle position
    }

    // Fetch or create rating entry
    let ratingRow = db.prepare(
      `SELECT id, elo, games_played, wins, losses, draws
       FROM ratings WHERE entity_key = ? AND entity_type = ?`,
    ).get(result.entityId, result.entityType) as { elo: number; games_played: number; wins: number; losses: number; draws: number } | undefined;

    let elo = DEFAULT_ELO;
    let gamesPlayed = 0;
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let isNew = false;

    if (!ratingRow) {
      // Create new rating entry
      db.prepare(
        `INSERT INTO ratings (entity_key, entity_type, entity_sub_type, elo, games_played)
         VALUES (?, ?, ?, ?, 1)`,
      ).run(result.entityId, result.entityType, result.subType ?? null, DEFAULT_ELO);
      elo = DEFAULT_ELO;
      gamesPlayed = 1;
      isNew = true;
    } else {
      elo = ratingRow.elo;
      gamesPlayed = ratingRow.games_played;
      wins = ratingRow.wins;
      losses = ratingRow.losses;
      draws = ratingRow.draws;
    }

    // Calculate expected score against all opponents
    let totalExpected = 0;
    for (const opponent of results) {
      if (opponent.entityId === result.entityId) continue;

      const opponentRow = db.prepare(
        `SELECT elo FROM ratings WHERE entity_key = ? AND entity_type = ?`,
      ).get(opponent.entityId, opponent.entityType) as { elo: number } | undefined;

      const opponentElo = opponentRow ? opponentRow.elo : DEFAULT_ELO;
      totalExpected += expectedScore(elo, opponentElo);
    }

    // Average expected score
    const opponentCount = results.length - 1;
    const expected = opponentCount > 0 ? totalExpected / opponentCount : 0.5;

    const eloBefore = elo;
    const newElo = calculateNewElo(elo, expected, score, gamesPlayed);

    const newWins = score === 1 ? wins + 1 : wins;
    const newLosses = score === 0 ? losses + 1 : losses;
    const newDraws = score === 0.5 ? draws + 1 : draws;

    db.prepare(
      `UPDATE ratings SET elo = ?, games_played = ?, wins = ?, losses = ?, draws = ?, updated_at = CURRENT_TIMESTAMP
       WHERE entity_key = ? AND entity_type = ?`,
    ).run(newElo, isNew ? gamesPlayed : gamesPlayed + 1, newWins, newLosses, newDraws, result.entityId, result.entityType);

    ratingResults.push({
      entityId: result.entityId,
      entityType: result.entityType,
      subType: result.subType,
      eloBefore,
      eloAfter: newElo,
    });
  }

  return ratingResults;
}

export const ratingUtil = { expectedScore, kFactor, calculateNewElo };
