import { GameStateDTO, ActionDTO } from "@raisk/shared";
import { advanceTurn } from "../state-machine";

export function handleFortify(state: GameStateDTO, action: ActionDTO): GameStateDTO {
  const from = state.territories[action.from_id!];
  const to = state.territories[action.to_id!];
  const armies = action.armies ?? 1;

  const newTerritories = {
    ...state.territories,
    [action.from_id!]: { ...from, armies: from.armies - armies },
    [action.to_id!]: { ...to, armies: to.armies + armies },
  };

  // Fortify ends the turn — advance to next player
  return advanceTurn({
    ...state,
    territories: newTerritories,
    last_action: { ...action, success: true },
  });
}
