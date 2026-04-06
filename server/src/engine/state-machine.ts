import { GameStateDTO, GamePhase, GameStatus } from "@raisk/shared";
import { CONTINENTS } from "@raisk/shared";
import { TERRITORIES } from "@raisk/shared";

/**
 * Phase transition and game-ending logic.
 * The state machine enforces valid transitions and checks win conditions.
 */
export function transitionTo(state: GameStateDTO, phase: GamePhase): GameStateDTO {
  return { ...state, phase, last_action: phase === "ATTACK" ? null : state.last_action };
}

export function checkWinCondition(state: GameStateDTO): GameStateDTO {
  const activePlayers = Object.entries(state.players).filter(([, p]) => !p.eliminated);

  if (activePlayers.length <= 1) {
    const winner = activePlayers.length === 1 ? activePlayers[0][0] : null;
    return {
      ...state,
      status: "COMPLETE",
      phase: "ATTACK",
      winner_id: winner,
      current_player_id: winner ?? state.current_player_id,
    };
  }

  // Check max turns
  if (state.turn_number > 1000) {
    return {
      ...state,
      status: "COMPLETE",
      phase: "ATTACK",
      winner_id: null,
    };
  }

  // Check if current player has no valid moves in DRAFT
  if (state.phase === "DRAFT" && state.troops_to_place <= 0) {
    // Move to attack phase
    return transitionTo(state, "ATTACK");
  }

  return state;
}

export function eliminatePlayer(state: GameStateDTO, playerId: string): GameStateDTO {
  const player = state.players[playerId];
  if (!player || player.eliminated) return state;

  const newPlayers = {
    ...state.players,
    [playerId]: { ...player, eliminated: true },
  };

  // Return all territories to a neutral state — give to conqueror or next player
  const newTerritories = { ...state.territories };
  for (const [id, terr] of Object.entries(newTerritories)) {
    if (terr.owner === playerId) {
      // Give to the player who has armies on adjacent territory,
      // or to the next active player in round-robin
      newTerritories[id] = { ...terr, owner: playerId, armies: 0 };
    }
  }

  return {
    ...state,
    players: newPlayers,
    territories: newTerritories,
  };
}

export function advanceTurn(state: GameStateDTO): GameStateDTO {
  const playerIds = Object.keys(state.players);
  const currentIdx = playerIds.indexOf(state.current_player_id);
  let nextIdx = (currentIdx + 1) % playerIds.length;

  // Skip eliminated players
  let attempts = 0;
  while (state.players[playerIds[nextIdx]]?.eliminated && attempts < playerIds.length) {
    nextIdx = (nextIdx + 1) % playerIds.length;
    attempts++;
  }

  const nextPlayerId = playerIds[nextIdx];
  const player = state.players[nextPlayerId];

  // Calculate reinforcements
  const territoryCount = Object.values(state.territories).filter(
    (t) => t.owner === nextPlayerId
  ).length;
  const reinforcements = Math.max(3, Math.floor(territoryCount / 3));

  // Check if player has no territories (shouldn't happen, but safety)
  if (territoryCount === 0 && !player.eliminated) {
    const newState = {
      ...state,
      players: {
        ...state.players,
        [nextPlayerId]: { ...player, eliminated: true },
      },
    };
    return advanceTurn(checkWinCondition(newState));
  }

  // Clear pending occupation and irradiation counters
  const newTerritories = { ...state.territories };
  for (const [id, t] of Object.entries(newTerritories)) {
    if (t.irradiated) {
      newTerritories[id] = { ...t };
    }
  }

  // Decrease sanction turns
  const newPlayers = { ...state.players };
  for (const [pid, p] of Object.entries(newPlayers)) {
    if (p.sanctioned_turns && p.sanctioned_turns > 0) {
      newPlayers[pid] = { ...p, sanctioned_turns: p.sanctioned_turns - 1 };
    }
  }

  let draftPhase = false;
  let draftTroops = 0;

  // If player has unowned territories, go back to DRAFT
  const hasUnowned = Object.values(newTerritories).some(
    (t) => t.owner === nextPlayerId && t.armies === 0
  );
  if (hasUnowned) {
    draftPhase = true;
    draftTroops = 1;
  }

  return checkWinCondition({
    ...state,
    phase: draftPhase ? "DRAFT" : "ATTACK",
    turn_number: draftPhase ? state.turn_number : state.turn_number + 1,
    current_player_id: nextPlayerId,
    troops_to_place: draftPhase ? draftTroops : reinforcements,
    territories: newTerritories,
    players: newPlayers,
    pending_occupation: null,
    last_action: null,
  });
}
