import { GameStateDTO, ActionDTO } from "@raisk/shared";
import { resolveCombat } from "../dice";
import { handleOccupy } from "./occupy";

/**
 * Blitz: auto-attack until the territory is conquered or attacker can't continue.
 * This handler runs the full combat loop in one step.
 */
export function handleBlitz(state: GameStateDTO, action: ActionDTO): GameStateDTO {
  let currentState = { ...state };
  let iterations = 0;
  const MAX_ITERATIONS = 100; // Safety limit

  while (iterations < MAX_ITERATIONS) {
    const from = currentState.territories[action.from_id!];
    const to = currentState.territories[action.to_id!];

    if (!from || !to || from.armies <= 1 || to.armies <= 0) break;

    const combatResult = resolveCombat(from.armies, to.armies);

    const newFrom = { ...from, armies: from.armies - combatResult.attackerLosses };
    const newTo = { ...to, armies: to.armies - combatResult.defenderLosses };

    currentState = {
      ...currentState,
      territories: {
        ...currentState.territories,
        [action.from_id!]: newFrom,
        [action.to_id!]: newTo,
      },
    };

    // Check if conquered
    if (newTo.armies <= 0) {
      const maxOccupy = newFrom.armies - 1;
      const minOccupy = Math.min(combatResult.attackerDice.length, maxOccupy);

      const occupyResult = handleOccupy(
        {
          ...currentState,
          pending_occupation: {
            from_id: action.from_id!,
            to_id: action.to_id!,
            min_armies: minOccupy,
            max_armies: maxOccupy,
          },
        },
        {
          type: "occupy",
          from_id: action.from_id,
          to_id: action.to_id,
          armies: Math.max(minOccupy, Math.floor(maxOccupy / 2)),
        }
      );

      currentState = {
        ...occupyResult,
        last_action: { ...action, success: true },
      };
      return currentState;
    }

    iterations++;
  }

  return {
    ...currentState,
    last_action: { ...action, success: false },
  };
}
