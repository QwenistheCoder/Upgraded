import { GameStateDTO, TerritoryStateDTO } from "@raisk/shared";
import { CONTINENT_BONUS } from "@raisk/shared";

/**
 * Calculate reinforcement troops for a player.
 * Rules:
 * - Base: floor(territories owned / 3), minimum 3
 * - + continent bonus for each fully controlled continent
 */
export function calculateReinforcements(
  playerId: string,
  territories: Record<string, TerritoryStateDTO>
): number {
  // Count territories owned by player
  let ownedCount = 0;
  const ownedByContinent = new Map<string, number>();
  const totalByContinent = new Map<string, number>();

  // Initialize continent counters
  for (const [continentId, bonus] of CONTINENT_BONUS.entries()) {
    totalByContinent.set(continentId, 0);
    ownedByContinent.set(continentId, 0);
  }

  for (const [id, terr] of Object.entries(territories)) {
    if (terr.owner === playerId) {
      ownedCount++;
    }
  }

  const base = Math.max(3, Math.floor(ownedCount / 3));
  return base;
}

/**
 * Full reinforcement calculation including continent bonuses.
 */
export function calculateReinforcementsFull(
  playerId: string,
  territories: Record<string, TerritoryStateDTO>,
  continentTerritories: Map<string, string[]> // continentId -> territory IDs
): number {
  let ownedCount = 0;
  let continentBonus = 0;

  for (const [id, terr] of Object.entries(territories)) {
    if (terr.owner === playerId) {
      ownedCount++;
    }
  }

  // Check continent control
  for (const [continentId, terrIds] of continentTerritories.entries()) {
    const fullyOwned = terrIds.every((id) => territories[id]?.owner === playerId);
    if (fullyOwned) {
      continentBonus += CONTINENT_BONUS.get(continentId) ?? 0;
    }
  }

  return Math.max(3, Math.floor(ownedCount / 3)) + continentBonus;
}
