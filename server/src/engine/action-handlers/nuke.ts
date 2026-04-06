import { GameStateDTO, ActionDTO } from "@raisk/shared";
import { getAdjacent } from "@raisk/shared";

export function handleNuke(state: GameStateDTO, action: ActionDTO): GameStateDTO {
  const targetId = action.to_id!;
  const target = state.territories[targetId];
  const playerId = state.current_player_id;
  const player = state.players[playerId];

  // Mark target as irradiated
  const newTerritories = {
    ...state.territories,
    [targetId]: { ...target, irradiated: true, armies: 0 },
  };

  // Damage adjacent territories (-50%, min 1)
  for (const adj of getAdjacent(targetId)) {
    if (newTerritories[adj]) {
      newTerritories[adj] = {
        ...newTerritories[adj],
        armies: Math.max(1, Math.floor(newTerritories[adj].armies * 0.5)),
      };
    }
  }

  // Sanction the nuke user (-50% for 3 turns)
  const newPlayers = {
    ...state.players,
    [playerId]: {
      ...player,
      nukes_remaining: Math.max(0, (player.nukes_remaining ?? 1) - 1),
      sanctioned_turns: 3,
    },
  };

  return {
    ...state,
    territories: newTerritories,
    players: newPlayers,
    last_action: { ...action, success: true },
  };
}
