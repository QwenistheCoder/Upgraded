import { GameStateDTO, ActionDTO } from "@raisk/shared";
import { resolveCombat, CombatResult } from "../dice";

export function handleAttack(state: GameStateDTO, action: ActionDTO): GameStateDTO {
  const from = state.territories[action.from_id!];
  const to = state.territories[action.to_id!];

  const combatResult = resolveCombat(from.armies, to.armies);

  let newFrom = { ...from, armies: from.armies - combatResult.attackerLosses };
  let newTo = { ...to, armies: to.armies - combatResult.defenderLosses };

  const lastAction: ActionDTO = {
    ...action,
    success: newTo.armies <= 0,
  };

  // If territory conquered
  if (newTo.armies <= 0) {
    const maxOccupy = newFrom.armies - 1;
    const minOccupy = combatResult.attackerDice.length; // must move at least dice count

    newFrom = { ...newFrom, armies: maxOccupy }; // max troops, will be set by occupy
    newTo = { owner: state.current_player_id, armies: 0 };

    return {
      ...state,
      territories: {
        ...state.territories,
        [action.from_id!]: newFrom,
        [action.to_id!]: newTo,
      },
      last_action: lastAction,
      pending_occupation: {
        from_id: action.from_id!,
        to_id: action.to_id!,
        min_armies: Math.min(minOccupy, maxOccupy),
        max_armies: maxOccupy,
      },
    };
  }

  return {
    ...state,
    territories: {
      ...state.territories,
      [action.from_id!]: newFrom,
      [action.to_id!]: newTo,
    },
    last_action: lastAction,
  };
}
