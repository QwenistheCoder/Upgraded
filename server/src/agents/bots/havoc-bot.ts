import { GameStateDTO, ActionDTO } from "@raisk/shared";
import { getAdjacent } from "@raisk/shared";
import { resolveCombat } from "../../engine/dice";

type Difficulty = "easy" | "medium" | "hard" | "extreme";

export class HavocBot {
  private aggressionThreshold: number;

  constructor(public playerId: string, private difficulty: Difficulty) {
    // Lower threshold = more aggressive
    this.aggressionThreshold = { easy: 1.8, medium: 1.3, hard: 1.0, extreme: 0.8 }[difficulty];
  }

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
      return { type: "place_troops", to_id: this.owned(state)[0], armies: 1 };

    // Place troops on strongest border to maximize attack potential
    const borders = this.owned(state).filter((t) => this.isBorder(t, state));
    const pick =
      borders.length > 0
        ? borders.sort(
            (a, b) => state.territories[b].armies - state.territories[a].armies
          )[0]
        : this.owned(state)[0];

    return {
      type: "place_troops",
      to_id: pick,
      armies: state.troops_to_place,
    };
  }

  private attackDecision(state: GameStateDTO): ActionDTO {
    if (state.pending_occupation) {
      return {
        type: "occupy",
        from_id: state.pending_occupation.from_id,
        to_id: state.pending_occupation.to_id,
        armies: state.pending_occupation.max_armies, // push forward aggressively
      };
    }

    // Find all attacks where we have an advantage
    const attacks: Array<{ from: string; to: string; advantage: number }> = [];

    for (const terrId of this.owned(state)) {
      const terr = state.territories[terrId];
      if (terr.armies <= 1) continue;

      for (const adj of getAdjacent(terrId)) {
        const enemy = state.territories[adj];
        if (!enemy || enemy.owner === this.playerId) continue;

        const advantage = terr.armies / Math.max(1, enemy.armies);
        if (advantage >= this.aggressionThreshold) {
          attacks.push({ from: terrId, to: adj, advantage });
        }
      }
    }

    if (attacks.length === 0) return { type: "end_attack" };

    // Always take the best attack (aggressive by nature)
    const best = attacks.sort((a, b) => b.advantage - a.advantage)[0];
    return { type: "attack", from_id: best.from, to_id: best.to };
  }

  private fortifyDecision(state: GameStateDTO): ActionDTO {
    // Push troops toward the most contested border for next attack
    const borders = this.owned(state)
      .filter((t) => this.isBorder(t, state))
      .sort(
        (a, b) =>
          this.enemyPressure(b, state) - this.enemyPressure(a, state)
      );

    if (borders.length > 0) {
      const target = borders[0];
      const strongestNeighbor = getAdjacent(target)
        .filter(
          (a) =>
            !this.isBorder(a, state) ||
            this.enemyPressure(a, state) === 0
        )
        .filter((a) => state.territories[a]?.owner === this.playerId)
        .sort(
          (a, b) => state.territories[b].armies - state.territories[a].armies
        )[0];

      if (strongestNeighbor && state.territories[strongestNeighbor].armies > 2) {
        return {
          type: "fortify",
          from_id: strongestNeighbor,
          to_id: target,
          armies: Math.floor(state.territories[strongestNeighbor].armies / 2),
        };
      }
    }

    return { type: "end_turn" };
  }

  private enemyPressure(terrId: string, state: GameStateDTO): number {
    return getAdjacent(terrId).filter(
      (adj) => state.territories[adj]?.owner !== this.playerId
    ).length;
  }

  private isBorder(terrId: string, state: GameStateDTO): boolean {
    return getAdjacent(terrId).some(
      (adj) => state.territories[adj]?.owner !== this.playerId
    );
  }

  private owned(state: GameStateDTO): string[] {
    return Object.entries(state.territories)
      .filter(([, t]) => t.owner === this.playerId)
      .map(([id]) => id);
  }
}
