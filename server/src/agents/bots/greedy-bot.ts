import { GameStateDTO, ActionDTO } from "@raisk/shared";
import { getAdjacent } from "@raisk/shared";
import { resolveCombat } from "../../engine/dice";

type Difficulty = "easy" | "medium" | "hard" | "extreme";

export class GreedyBot {
  constructor(public playerId: string, private difficulty: Difficulty) {}

  async decide(state: GameStateDTO): Promise<ActionDTO | null> {
    switch (state.phase) {
      case "DRAFT":
        return this.draftDecision(state);
      case "ATTACK":
        return this.attackDecision(state);
      case "FORTIFY":
        return this.fortifyDecision(state);
      default:
        return null;
    }
  }

  private draftDecision(state: GameStateDTO): ActionDTO {
    if (state.troops_to_place <= 0)
      return { type: "place_troops", to_id: this.owned( state)[0], armies: 1 };
    const owned = this.owned(state).filter(
      (t) => this.isBorder(t, state)
    );
    const pick =
      owned.length > 0
        ? owned.sort((a, b) => {
            const aWeaker = this.weakestAdjacent(a, state);
            const bWeaker = this.weakestAdjacent(b, state);
            return (aWeaker?.armies ?? 999) - (bWeaker?.armies ?? 999);
          })[0]
        : this.owned(state)[0];
    return { type: "place_troops", to_id: pick, armies: state.troops_to_place };
  }

  private attackDecision(state: GameStateDTO): ActionDTO {
    if (state.pending_occupation) {
      return {
        type: "occupy",
        from_id: state.pending_occupation.from_id,
        to_id: state.pending_occupation.to_id,
        armies: Math.max(
          state.pending_occupation.min_armies,
          Math.floor(state.pending_occupation.max_armies / 2)
        ),
      };
    }

    // Find all possible attacks and score them
    const attacks = this.findAttacks(state);
    if (attacks.length === 0) return { type: "end_attack" };

    // Sort by expected value (positive = favorable)
    const positiveAttacks = attacks.filter((a) => a.expectedValue > 0);

    if (positiveAttacks.length === 0) return { type: "end_attack" };

    // Pick the most advantageous attack
    const best = positiveAttacks.sort((a, b) => b.expectedValue - a.expectedValue)[0];

    // Easy: 30% skip positive attacks
    if (this.difficulty === "easy" && Math.random() < 0.3) {
      return { type: "end_attack" };
    }

    // Medium: 10% skip
    if (this.difficulty === "medium" && Math.random() < 0.1) {
      return { type: "end_attack" };
    }

    return { type: "attack", from_id: best.from, to_id: best.to };
  }

  private fortifyDecision(state: GameStateDTO): ActionDTO {
    // Move troops from interior to border
    for (const fromId of this.interiorTerritories(state)) {
      const terr = state.territories[fromId];
      if (terr.armies > 1) {
        const borderAdj = getAdjacent(fromId).filter(
          (a) => this.isBorder(a, state) && state.territories[a]?.owner === this.playerId
        );
        if (borderAdj.length > 0) {
          return {
            type: "fortify",
            from_id: fromId,
            to_id: borderAdj[0],
            armies: terr.armies - 1,
          };
        }
      }
    }
    return { type: "end_turn" };
  }

  private findAttacks(
    state: GameStateDTO
  ): Array<{ from: string; to: string; expectedValue: number }> {
    const attacks: Array<{ from: string; to: string; expectedValue: number }> = [];

    for (const terrId of this.owned(state)) {
      const terr = state.territories[terrId];
      if (terr.armies <= 1) continue;

      for (const adj of getAdjacent(terrId)) {
        const enemy = state.territories[adj];
        if (!enemy || enemy.owner === this.playerId) continue;

        const result = resolveCombat(terr.armies, enemy.armies);
        const expectedValue = enemy.armies - result.attackerLosses;
        const winProbability = terr.armies > enemy.armies ? 0.7 : terr.armies > enemy.armies * 1.5 ? 0.9 : 0.4;

        attacks.push({
          from: terrId,
          to: adj,
          expectedValue: expectedValue * winProbability,
        });
      }
    }

    return attacks;
  }

  private weakestAdjacent(
    terrId: string,
    state: GameStateDTO
  ): { armies: number } | undefined {
    let weakest: { armies: number } | undefined;
    for (const adj of getAdjacent(terrId)) {
      const t = state.territories[adj];
      if (t && t.owner !== this.playerId) {
        if (!weakest || t.armies < weakest.armies) {
          weakest = { armies: t.armies };
        }
      }
    }
    return weakest;
  }

  private isBorder(terrId: string, state: GameStateDTO): boolean {
    return getAdjacent(terrId).some(
      (adj) => state.territories[adj]?.owner !== this.playerId
    );
  }

  private interiorTerritories(state: GameStateDTO): string[] {
    return this.owned(state).filter((t) => !this.isBorder(t, state));
  }

  private owned(state: GameStateDTO): string[] {
    return Object.entries(state.territories)
      .filter(([, t]) => t.owner === this.playerId)
      .map(([id]) => id);
  }
}
