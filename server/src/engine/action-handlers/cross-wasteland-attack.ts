import { GameStateDTO, ActionDTO } from "@raisk/shared";
import { resolveCombat } from "../dice";

export function handleCrossWastelandAttack(state: GameStateDTO, action: ActionDTO): GameStateDTO {
  const commit = action.commit ?? 1;
  const from = state.territories[action.from_id!];
  const through = state.territories[action.through_id!];
  const to = state.territories[action.to_id!];

  // Cross-wasteland: commit dice count worth of troops, rest are lost
  const attackDice = Math.min(3, Math.max(1, Math.floor(commit / 2)));
  const defenseDice = Math.min(2, to.armies);

  const combatResult = resolveCombat(commit, to.armies);

  let newFrom = { ...from, armies: from.armies - commit };
  const attackingForce = commit - combatResult.attackerLosses;
  let newTo = { ...to, armies: to.armies - combatResult.defenderLosses };

  const lastAction: ActionDTO = { ...action, success: newTo.armies <= 0 };

  if (newTo.armies <= 0) {
    const minOccupy = Math.min(attackDice, attackingForce);
    const maxOccupy = attackingForce;

    return {
      ...state,
      territories: {
        ...state.territories,
        [action.from_id!]: newFrom,
        [action.through_id!]: { ...through },
        [action.to_id!]: { owner: state.current_player_id, armies: 0 },
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
    },
    last_action: lastAction,
  };
}
