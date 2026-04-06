/**
 * Risk dice combat resolution.
 * Attacker rolls up to 3 dice, defender rolls up to 2.
 * Dice are compared highest-to-highest; ties go to defender.
 */

function rollDice(count: number): number[] {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * 6) + 1);
  }
  return rolls.sort((a, b) => b - a);
}

export interface CombatResult {
  attackerLosses: number;
  defenderLosses: number;
  attackerDice: number[];
  defenderDice: number[];
}

export function resolveCombat(attackingArmies: number, defendingArmies: number): CombatResult {
  const attackDiceCount = Math.min(3, attackingArmies - 1); // must leave 1 behind
  const defenseDiceCount = Math.min(2, defendingArmies);

  const attackRolls = rollDice(attackDiceCount);
  const defenseRolls = rollDice(defenseDiceCount);

  const comparisons = Math.min(attackRolls.length, defenseRolls.length);
  let attackerLosses = 0;
  let defenderLosses = 0;

  for (let i = 0; i < comparisons; i++) {
    if (attackRolls[i] > defenseRolls[i]) {
      defenderLosses++;
    } else {
      attackerLosses++; // ties go to defender
    }
  }

  return { attackerLosses, defenderLosses, attackerDice: attackRolls, defenderDice: defenseRolls };
}
