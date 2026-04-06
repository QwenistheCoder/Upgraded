import { GameStateDTO, ActionDTO } from "@raisk/shared";

export function handleOccupy(state: GameStateDTO, action: ActionDTO): GameStateDTO {
  const armies = action.armies ?? 1;

  if (!state.pending_occupation) return state;

  const newTerritories = {
    ...state.territories,
    [state.pending_occupation.from_id]: {
      ...state.territories[state.pending_occupation.from_id],
    },
    [state.pending_occupation.to_id]: {
      ...state.territories[state.pending_occupation.to_id],
      armies, // conqueror places troops
    },
  };

  return {
    ...state,
    territories: newTerritories,
    pending_occupation: null,
    last_action: { ...action, success: true },
  };
}
