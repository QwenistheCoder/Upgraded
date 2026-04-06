import { GameStateDTO, ActionDTO, AgentConfig } from "@raisk/shared";
import { isAdjacent, getAdjacent } from "@raisk/shared";
import { getTradeBonusAmount } from "../../engine/card-system";

type Difficulty = "easy" | "medium" | "hard" | "extreme";

export class RandomBot {
  constructor(public playerId: string, private difficulty: Difficulty) {}

  async decide(state: GameStateDTO): Promise<ActionDTO | null> {
    const actions = this.getValidActions(state);
    if (actions.length === 0) return null;

    // Easy: 40% chance random invalid move attempt (caught by validator)
    if (this.difficulty === "easy" && Math.random() < 0.3) {
      return this.randomMove(state);
    }

    return actions[Math.floor(Math.random() * actions.length)];
  }

  private getValidActions(state: GameStateDTO): ActionDTO[] {
    switch (state.phase) {
      case "DRAFT":
        return this.draftActions(state);
      case "ATTACK":
        return this.attackActions(state);
      case "FORTIFY":
        return this.fortifyActions(state);
      default:
        return [];
    }
  }

  private draftActions(state: GameStateDTO): ActionDTO[] {
    if (state.troops_to_place <= 0) return [{ type: "place_troops", to_id: this.ownedTerritories(state)[0], armies: 1 }];
    const owned = this.ownedTerritories(state).filter((t) => state.territories[t].armies > 0);
    if (owned.length === 0) return [{ type: "place_troops", to_id: this.ownedTerritories(state)[0], armies: 1 }];
    const pick = owned[Math.floor(Math.random() * owned.length)];
    return [{ type: "place_troops", to_id: pick, armies: 1 }];
  }

  private attackActions(state: GameStateDTO): ActionDTO[] {
    if (state.pending_occupation) {
      return [
        {
          type: "occupy",
          from_id: state.pending_occupation.from_id,
          to_id: state.pending_occupation.to_id,
          armies: state.pending_occupation.min_armies,
        },
      ];
    }

    const attacks: ActionDTO[] = [];
    for (const terrId of this.ownedTerritories(state)) {
      const terr = state.territories[terrId];
      if (terr.armies > 1) {
        for (const adj of getAdjacent(terrId)) {
          if (state.territories[adj]?.owner !== this.playerId) {
            attacks.push({ type: "attack", from_id: terrId, to_id: adj });
          }
        }
      }
    }

    if (attacks.length > 0) {
      // Add end_attack option
      return [...attacks, { type: "end_attack" }];
    }
    return [{ type: "end_attack" }];
  }

  private fortifyActions(state: GameStateDTO): ActionDTO[] {
    // Try to find a valid fortify move
    for (const terrId of this.ownedTerritories(state)) {
      const terr = state.territories[terrId];
      const adjacent = getAdjacent(terrId);
      for (const adj of adjacent) {
        if (
          state.territories[adj]?.owner === this.playerId &&
          terr.armies > 1
        ) {
          return [{ type: "fortify", from_id: terrId, to_id: adj, armies: 1 }];
        }
      }
    }
    return [{ type: "end_turn" }];
  }

  private randomMove(state: GameStateDTO): ActionDTO {
    if (state.phase === "DRAFT") {
      const owned = this.ownedTerritories(state);
      return { type: "place_troops", to_id: owned[0], armies: 1 };
    }
    if (state.phase === "ATTACK") {
      return { type: "end_attack" };
    }
    return { type: "end_turn" };
  }

  private ownedTerritories(state: GameStateDTO): string[] {
    return Object.entries(state.territories)
      .filter(([, t]) => t.owner === this.playerId)
      .map(([id]) => id);
  }
}
