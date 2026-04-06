import {
  GameStateDTO,
  ActionDTO,
  TerritoryStateDTO,
} from "@raisk/shared";
import { isAdjacent, getAdjacent } from "@raisk/shared";

/**
 * Validates an action against the current game state.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

function ok(): ValidationResult {
  return { valid: true };
}

function fail(reason: string): ValidationResult {
  return { valid: false, reason };
}

const terr = (
  territories: Record<string, TerritoryStateDTO>,
  id: string
): TerritoryStateDTO | undefined => territories[id];

export function validateAction(state: GameStateDTO, action: ActionDTO, playerId: string): ValidationResult {
  const { phase, territories, players, troops_to_place, current_player_id } = state;

  if (current_player_id !== playerId) {
    return fail("Not your turn");
  }

  const player = players[playerId];
  if (!player) return fail("Player not found");
  if (player.eliminated) return fail("Player is eliminated");

  switch (action.type) {
    case "place_troops":
      return validatePlaceTroops(state, action);
    case "attack":
      return validateAttack(state, action);
    case "blitz":
      return validateBlitz(state, action);
    case "fortify":
      return validateFortify(state, action);
    case "occupy":
      return validateOccupy(state, action);
    case "nuke":
      return validateNuke(state, action);
    case "cross_wasteland_attack":
      return validateCrossWastelandAttack(state, action);
    case "card_trade":
      return validateCardTrade(state, action);
    case "end_attack":
      return validateEndAttack(state);
    case "end_turn":
      return validateEndTurn(state);
    default:
      return fail(`Unknown action type: ${action.type}`);
  }
}

function validatePlaceTroops(state: GameStateDTO, action: ActionDTO): ValidationResult {
  if (state.phase !== "DRAFT") return fail("Can only place troops during draft phase");
  if (!action.to_id) return fail("Missing territory ID");

  const target = terr(state.territories, action.to_id);
  if (!target) return fail("Territory not found");
  if (target.owner !== state.current_player_id)
    return fail("Must place on your territory");
  if (action.armies === undefined || action.armies < 1)
    return fail("Must place at least 1 troop");
  if (action.armies > state.troops_to_place)
    return fail("Not enough troops to place");

  return ok();
}

function validateAttack(state: GameStateDTO, action: ActionDTO): ValidationResult {
  if (state.phase !== "ATTACK") return fail("Can only attack during attack phase");
  if (!action.from_id || !action.to_id) return fail("Missing territory IDs");

  const from = terr(state.territories, action.from_id);
  const to = terr(state.territories, action.to_id);

  if (!from || !to) return fail("Territory not found");
  if (from.owner !== state.current_player_id) return fail("You must own the attacking territory");
  if (to.owner === state.current_player_id) return fail("Cannot attack your own territory");
  if (!isAdjacent(action.from_id, action.to_id)) return fail("Territories are not adjacent");
  if (from.armies <= 1) return fail("Need at least 2 armies to attack");

  return ok();
}

function validateBlitz(state: GameStateDTO, action: ActionDTO): ValidationResult {
  return validateAttack(state, action); // same preconditions as attack
}

function validateFortify(state: GameStateDTO, action: ActionDTO): ValidationResult {
  if (state.phase !== "FORTIFY") return fail("Can only fortify during fortify phase");
  if (!action.from_id || !action.to_id) return fail("Missing territory IDs");

  const from = terr(state.territories, action.from_id);
  const to = terr(state.territories, action.to_id);

  if (!from || !to) return fail("Territory not found");
  if (from.owner !== state.current_player_id) return fail("From territory must be yours");
  if (to.owner !== state.current_player_id) return fail("To territory must be yours");

  // Check if connected via friendly path
  if (!hasFriendlyPath(state.territories, action.from_id, action.to_id, state.current_player_id))
    return fail("No connected path of your territories");

  if (action.armies === undefined || action.armies < 1) return fail("Must move at least 1 army");
  if (action.armies >= from.armies) return fail("Must leave at least 1 army behind");

  return ok();
}

function validateOccupy(state: GameStateDTO, action: ActionDTO): ValidationResult {
  if (!state.pending_occupation) return fail("No pending occupation");

  const occ = state.pending_occupation;
  if (action.from_id !== occ.from_id || action.to_id !== occ.to_id)
    return fail("Must occupy the conquered territory");
  if (action.armies === undefined || action.armies < occ.min_armies || action.armies > occ.max_armies)
    return fail(`Must move between ${occ.min_armies} and ${occ.max_armies} armies`);

  return ok();
}

function validateNuke(state: GameStateDTO, action: ActionDTO): ValidationResult {
  if (!action.to_id) return fail("Missing target territory");
  const target = terr(state.territories, action.to_id);
  if (!target) return fail("Territory not found");
  if (target.owner !== state.current_player_id)
    return fail("Cannot nuke territories you don't own");
  if (target.irradiated) return fail("Cannot nuke irradiated territory");

  const player = state.players[state.current_player_id];
  if (!player.nukes_remaining || player.nukes_remaining <= 0)
    return fail("No nukes remaining");
  if (player.sanctioned_turns && player.sanctioned_turns > 0)
    return fail("Cannot nuke while sanctioned by UN");

  return ok();
}

function validateCrossWastelandAttack(state: GameStateDTO, action: ActionDTO): ValidationResult {
  if (state.phase !== "ATTACK") return fail("Can only attack during attack phase");
  if (!action.from_id || !action.through_id || !action.to_id)
    return fail("Missing territory IDs");

  const from = terr(state.territories, action.from_id);
  const through = terr(state.territories, action.through_id);
  const to = terr(state.territories, action.to_id);

  if (!from || !through || !to) return fail("Territory not found");
  if (from.owner !== state.current_player_id) return fail("From territory must be yours");
  if (!through.irradiated) return fail("Through territory must be irradiated");
  if (to.owner === state.current_player_id) return fail("Cannot attack your own territory");
  if (!isAdjacent(action.through_id, action.to_id))
    return fail("Target must be adjacent to irradiated territory");
  if (from.armies < 3) return fail("Need at least 3 armies for cross-wasteland attack");

  return ok();
}

function validateCardTrade(state: GameStateDTO, action: ActionDTO): ValidationResult {
  if (!action.card_indices || action.card_indices.length < 3)
    return fail("Must trade at least 3 cards");
  if (!action.card_indices.every((i) => i >= 0))
    return fail("Invalid card indices");

  const player = state.players[state.current_player_id];
  if (!player.cards || action.card_indices.some((i) => i >= player.cards!.length))
    return fail("Card index out of range");

  return ok();
}

function validateEndAttack(state: GameStateDTO): ValidationResult {
  if (state.phase !== "ATTACK") return fail("Not in attack phase");
  return ok();
}

function validateEndTurn(state: GameStateDTO): ValidationResult {
  if (state.phase !== "FORTIFY") return fail("Not in fortify phase");
  return ok();
}

/**
 * BFS path search through friendly territories.
 */
function hasFriendlyPath(
  territories: Record<string, TerritoryStateDTO>,
  from: string,
  to: string,
  ownerId: string
): boolean {
  if (from === to) return true;

  const visited = new Set<string>();
  const queue = [from];
  visited.add(from);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of getAdjacent(current)) {
      if (neighbor === to) return true;
      if (!visited.has(neighbor) && territories[neighbor]?.owner === ownerId) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return false;
}
