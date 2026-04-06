import { GameStateDTO, ActionDTO } from "@raisk/shared";
import { getAdjacent } from "@raisk/shared";
import { resolveCombat } from "../../engine/dice";

type Difficulty = "easy" | "medium" | "hard" | "extreme";

export class DiplomatBot {
  private alliances: Set<string> = new Set();
  private betrayals: number = 0;

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

    // Prioritize defending against non-allies
    const borders = this.owned(state).filter((t) => this.isBorder(t, state));
    const threatenedBorders = borders.filter((t) =>
      getAdjacent(t).some(
        (adj) =>
          state.territories[adj]?.owner !== this.playerId &&
          !this.alliances.has(state.territories[adj]?.owner ?? "")
      )
    );

    const pick =
      threatenedBorders.length > 0
        ? threatenedBorders.sort(
            (a, b) => state.territories[a].armies - state.territories[b].armies
          )[0]
        : borders.length > 0
          ? borders.sort(
              (a, b) => state.territories[a].armies - state.territories[b].armies
            )[0]
          : this.owned(state)[0];

    return {
      type: "place_troops",
      to_id: pick,
      armies: state.troops_to_place,
      message: threatenedBorders.length > 0 ? "Strengthening my borders for defense." : undefined,
    };
  }

  private attackDecision(state: GameStateDTO): ActionDTO {
    if (state.pending_occupation) {
      return {
        type: "occupy",
        from_id: state.pending_occupation.from_id,
        to_id: state.pending_occupation.to_id,
        armies: Math.floor(state.pending_occupation.max_armies / 2),
        message: "Securing this territory.",
      };
    }

    // Find all attacks avoiding allies
    const attacks: Array<{ from: string; to: string; advantage: number }> = [];

    for (const terrId of this.owned(state)) {
      const terr = state.territories[terrId];
      if (terr.armies <= 1) continue;

      for (const adj of getAdjacent(terrId)) {
        const enemy = state.territories[adj];
        if (!enemy || enemy.owner === this.playerId) continue;

        // Avoid attacking allies (unless easy difficulty)
        if (this.alliances.has(enemy.owner) && this.difficulty !== "easy") {
          continue;
        }

        const advantage = terr.armies / Math.max(1, enemy.armies);
        if (advantage >= 1.5) {
          attacks.push({ from: terrId, to: adj, advantage });
        }
      }
    }

    if (attacks.length === 0) {
      return { type: "end_attack", message: "I seek peace for now." };
    }

    // Pick best attack
    const best = attacks.sort((a, b) => b.advantage - a.advantage)[0];

    // Betray an ally only if overwhelmingly advantageous and desperate
    // (This would need ally tracking - simplified here)

    return {
      type: "attack",
      from_id: best.from,
      to_id: best.to,
      message: "I must expand for my people.",
    };
  }

  private fortifyDecision(state: GameStateDTO): ActionDTO {
    // Move troops from safe interior to threatened borders
    const threatenedBorders = this.owned(state)
      .filter((t) => this.isBorder(t, state))
      .filter((t) =>
        getAdjacent(t).some(
          (adj) =>
            state.territories[adj]?.owner !== this.playerId &&
            !this.alliances.has(state.territories[adj]?.owner ?? "")
        )
      )
      .sort(
        (a, b) => state.territories[a].armies - state.territories[b].armies
      );

    if (threatenedBorders.length > 0) {
      const target = threatenedBorders[0];
      const fromId = this.findSupplyRoute(state, target);
      if (fromId && state.territories[fromId].armies > 2) {
        return {
          type: "fortify",
          from_id: fromId,
          to_id: target,
          armies: Math.floor(state.territories[fromId].armies / 2),
          message: "Repositioning forces for defense.",
        };
      }
    }

    return { type: "end_turn" };
  }

  private findSupplyRoute(state: GameStateDTO, target: string): string | null {
    // BFS to find friendly territory with most armies that can reach target
    const visited = new Set<string>();
    const queue = [target];
    visited.add(target);

    let bestSource: string | null = null;
    let bestArmies = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const terr = state.territories[current];

      if (current !== target && terr.armies > bestArmies) {
        bestSource = current;
        bestArmies = terr.armies;
      }

      for (const adj of getAdjacent(current)) {
        if (
          !visited.has(adj) &&
          state.territories[adj]?.owner === this.playerId
        ) {
          visited.add(adj);
          queue.push(adj);
        }
      }
    }

    return bestSource;
  }

  public proposeAlliance(targetId: string): void {
    this.alliances.add(targetId);
  }

  public breakAlliance(targetId: string): void {
    if (this.alliances.has(targetId)) {
      this.alliances.delete(targetId);
      this.betrayals++;
    }
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
