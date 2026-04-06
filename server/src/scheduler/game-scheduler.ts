import { v4 as uuidv4 } from "uuid";
import { GameConfig, GameStateDTO, ActionDTO, GameEvent } from "@raisk/shared";
import { GameEngine, OnStateUpdate, OnGameEnd } from "../engine/game-engine";
import { createAgent } from "../agents/agent-factory";

export interface GameInstance {
  id: string;
  engine: GameEngine;
  subscribers: Set<(event: GameEvent) => void>;
}

export const gameRegistry = {
  games: new Map<string, GameInstance>(),

  create(config: GameConfig): GameInstance {
    const id = uuidv4().slice(0, 8);
    const instance: GameInstance = {
      id,
      engine: {} as GameEngine,
      subscribers: new Set(),
    };

    const onStateUpdate: OnStateUpdate = (state: GameStateDTO) => {
      const event: GameEvent = { event: "game-state", data: state };
      instance.subscribers.forEach((cb) => cb(event));
    };

    const onGameEnd: OnGameEnd = (state: GameStateDTO) => {
      const event: GameEvent = { event: "game-end", data: state };
      instance.subscribers.forEach((cb) => cb(event));
    };

    instance.engine = new GameEngine(config, onStateUpdate, onGameEnd);
    this.games.set(id, instance);

    return instance;
  },

  get(id: string): GameInstance | undefined {
    return this.games.get(id);
  },

  delete(id: string): boolean {
    return this.games.delete(id);
  },

  get size(): number {
    return this.games.size;
  },

  subscribe(id: string, onUpdate: (state: GameStateDTO) => void, onEnd: (state: GameStateDTO) => void) {
    const instance = this.games.get(id);
    if (!instance) return;

    const handler = (event: GameEvent) => {
      if (event.event === "game-state") onUpdate(event.data);
      if (event.event === "game-end") onEnd(event.data);
    };

    instance.subscribers.add(handler);
  },

  unsubscribe(id: string, onUpdate: (state: GameStateDTO) => void, onEnd: (state: GameStateDTO) => void) {
    const instance = this.games.get(id);
    if (!instance) return;
    for (const cb of instance.subscribers) {
      instance.subscribers.delete(cb);
    }
  },

  // Run a game to completion with its configured agents
  async runGame(id: string): Promise<GameStateDTO> {
    const instance = this.games.get(id);
    if (!instance) throw new Error("Game not found");

    const engines = instance.engine;
    const config = engines.getConfig();

    const decide = async (playerId: string, state: GameStateDTO): Promise<ActionDTO | null> => {
      const agentConfig = config.agents[parseInt(playerId.split("_")[1])];
      if (!agentConfig || agentConfig.type === "human") return null;

      const agent = createAgent(agentConfig, playerId);
      return agent.decide(state);
    };

    return engines.run(decide, config.max_turns ?? 1000);
  },
};
