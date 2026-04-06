import { GameStateDTO, ActionDTO } from "@raisk/shared";
import { getAdjacent } from "@raisk/shared";

type Difficulty = "easy" | "medium" | "hard" | "extreme";

export class TurtlenatorBot {
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
      return { type: "place_troops", to_id: this.owned(state)[0], armies: 1 };

    // Place on weakest border territory to strengthen defense
    const borders = this.owned(state).filter((t) => this.isBorder(t, state));
    const pick =
      borders.length > 0
        ? borders.sort(
            (a, b) => state.territories[a].armies - state.territories[b].armies
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
        armies: state.pending_occupation.min_armies, // minimal occupation, keep defense
      };
    }

    // Only attack if we have overwhelming advantage (2x+ armies)
    const attacks: Array<{ from: string; to: string; ratio: number }> = [];

    for (const terrId of this.owned(state)) {
      const terr = state.territories[terrId];
      if (terr.armies <= 1) continue;

      for (const adj of getAdjacent(terrId)) {
        const enemy = state.territories[adj];
        if (!enemy || enemy.owner === this.playerId) continue;

        const ratio = terr.armies / enemy.armies;
        if (ratio >= 2) {
          attacks.push({ from: terrId, to: adj, ratio });
        }
      }
    }

    if (attacks.length === 0) return { type: "end_attack" };

    // Pick best ratio
    const best = attacks.sort((a, b) => b.ratio - a.ratio)[0];

    // Only attack if very favorable
    const threshold = this.difficulty === "hard" || this.difficulty === "extreme" ? 1.5 : 2;
    if (best.ratio >= threshold) {
      return { type: "attack", from_id: best.from, to_id: best.to };
    }

    return { type: "end_attack" };
  }

  private fortifyDecision(state: GameStateDTO): ActionDTO {
    // Fortify borders: move troops from interior to weak borders
    for (const fromId of this.owned(state)) {
      if (!this.isBorder(fromId, state)) {
        const terr = state.territories[fromId];
        if (terr.armies > 2) {
          // Find weakest border neighbor
          const borderAdj = getAdjacent(fromId)
            .filter(
              (a) =>
                this.isBorder(a, state) &&
                state.territories[a]?.owner === this.playerId
            )
            .sort(
              (a, b) => state.territories[a].armies - state.territories[b].armies
            );

          if (borderAdj.length > 0) {
            return {
              type: "fortify",
              from_id: fromId,
              to_id: borderAdj[0],
              armies: Math.floor(terr.armies / 2),
            };
          }
        }
      }
    }
    return { type: "end_turn" };
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
