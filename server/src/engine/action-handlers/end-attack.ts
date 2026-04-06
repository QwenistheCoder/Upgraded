import { GameStateDTO, ActionDTO } from "@raisk/shared";
import { transitionTo } from "../state-machine";

export function handleEndAttack(state: GameStateDTO, action: ActionDTO): GameStateDTO {
  return transitionTo(
    {
      ...state,
      last_action: { ...action, success: true },
    },
    "FORTIFY"
  );
}
