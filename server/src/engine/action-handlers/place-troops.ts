import { GameStateDTO, ActionDTO } from "@raisk/shared";

export function handlePlaceTroops(state: GameStateDTO, action: ActionDTO): GameStateDTO {
  const territory = state.territories[action.to_id!];
  const armies = action.armies ?? 1;

  const newTerritories = {
    ...state.territories,
    [action.to_id!]: {
      ...territory,
      armies: territory.armies + armies,
    },
  };

  const remaining = state.troops_to_place - armies;
  const lastAction = { ...action, success: true };

  // If no more troops to place, advance to attack phase
  if (remaining <= 0) {
    return {
      ...state,
      territories: newTerritories,
      troops_to_place: 0,
      last_action: lastAction,
      phase: "ATTACK",
      pending_occupation: null,
    };
  }

  return {
    ...state,
    territories: newTerritories,
    troops_to_place: remaining,
    last_action: lastAction,
  };
}
