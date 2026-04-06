import { GameStateDTO, ActionDTO, GameConfig, GameEvent } from "@raisk/shared";
import { validateAction, ValidationResult } from "./action-validator";
import { checkWinCondition, eliminatePlayer } from "./state-machine";
import { handlePlaceTroops } from "./action-handlers/place-troops";
import { handleAttack } from "./action-handlers/attack";
import { handleBlitz } from "./action-handlers/blitz";
import { handleFortify } from "./action-handlers/fortify";
import { handleOccupy } from "./action-handlers/occupy";
import { handleNuke } from "./action-handlers/nuke";
import { handleCardTrade } from "./action-handlers/card-trade";
import { handleCrossWastelandAttack } from "./action-handlers/cross-wasteland-attack";
import { handleEndAttack } from "./action-handlers/end-attack";
import { handleEndTurn } from "./action-handlers/end-turn";
import { createInitialState } from "./draft-manager";
import { createPlayers, distributeTerritories } from "./draft-manager";

export type OnStateUpdate = (state: GameStateDTO, action: ActionDTO | null) => void;
export type OnGameEnd = (state: GameStateDTO) => void;

export class GameEngine {
  private state: GameStateDTO;
  private onStateUpdate: OnStateUpdate;
  private onGameEnd: OnGameEnd;
  private running = false;
  private config: GameConfig;
  private actions: ActionDTO[] = [];

  constructor(config: GameConfig, onStateUpdate: OnStateUpdate, onGameEnd: OnGameEnd) {
    this.config = config;
    this.state = createInitialState(config);
    this.onStateUpdate = onStateUpdate;
    this.onGameEnd = onGameEnd;
  }

  getState(): GameStateDTO {
    return this.state;
  }

  getActions(): ActionDTO[] {
    return this.actions;
  }

  getConfig(): GameConfig {
    return this.config;
  }

  /**
   * Process an action from a human player or an AI agent.
   */
  processAction(action: ActionDTO, playerId: string): GameStateDTO | null {
    if (this.state.status !== "RUNNING") return null;
    if (this.state.current_player_id !== playerId) return null;

    const validation = validateAction(this.state, action, playerId);
    if (!validation.valid) return null;

    this.state = this.executeAction(this.state, action);

    // Check for eliminated opponent
    this.checkEliminations();

    this.state = checkWinCondition(this.state);
    this.actions.push(action);

    this.onStateUpdate(this.state, action);

    if (this.state.status === "COMPLETE") {
      this.onGameEnd(this.state);
      this.running = false;
    }

    return this.state;
  }

  /**
   * Execute an action using the appropriate handler.
   */
  private executeAction(state: GameStateDTO, action: ActionDTO): GameStateDTO {
    switch (action.type) {
      case "place_troops":
        return handlePlaceTroops(state, action);
      case "attack":
        return handleAttack(state, action);
      case "blitz":
        return handleBlitz(state, action);
      case "fortify":
        return handleFortify(state, action);
      case "occupy":
        return handleOccupy(state, action);
      case "nuke":
        return handleNuke(state, action);
      case "card_trade":
        return handleCardTrade(state, action);
      case "cross_wasteland_attack":
        return handleCrossWastelandAttack(state, action);
      case "end_attack":
        return handleEndAttack(state, action);
      case "end_turn":
        return handleEndTurn(state, action);
      default:
        return state;
    }
  }

  /**
   * Check if any player has been eliminated (lost all territories).
   */
  private checkEliminations(): void {
    for (const [playerId, player] of Object.entries(this.state.players)) {
      if (player.eliminated) continue;

      const hasTerritory = Object.values(this.state.territories).some(
        (t) => t.owner === playerId
      );

      if (!hasTerritory) {
        this.state = eliminatePlayer(this.state, playerId);
      }
    }
  }

  /**
   * Run the game loop for AI agents.
   * This is the main game loop that iterates through AI players.
   */
  async run(
    decide: (
      playerId: string,
      state: GameStateDTO
    ) => Promise<ActionDTO | null>,
    maxActions = 5000
  ): Promise<GameStateDTO> {
    this.running = true;
    let counter = 0;

    while (this.state.status === "RUNNING" && counter < maxActions) {
      const currentPlayer = this.state.current_player_id;

      if (this.state.players[currentPlayer]?.eliminated) {
        this.state = checkWinCondition(this.state);
        continue;
      }

      const action = await decide(currentPlayer, this.state);
      if (action) {
        this.processAction(action, currentPlayer);
      } else {
        // Agent couldn't decide — skip to next logic
        if (this.state.phase === "ATTACK") {
          this.processAction({ type: "end_attack" }, currentPlayer);
        } else if (this.state.phase === "FORTIFY") {
          this.processAction({ type: "end_turn" }, currentPlayer);
        }
      }

      counter++;

      // Apply move delay
      const delay = this.config.move_delay_ms ?? 0;
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    this.running = false;
    if (this.state.status === "COMPLETE") {
      this.onGameEnd(this.state);
    }

    return this.state;
  }

  isRunning(): boolean {
    return this.running;
  }

  stop(): void {
    this.running = false;
    if (this.state.status === "RUNNING") {
      this.state = { ...this.state, status: "CANCELLED" };
      this.onStateUpdate(this.state, null);
    }
  }
}
