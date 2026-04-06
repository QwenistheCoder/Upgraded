import { AgentConfig, GameStateDTO, ActionDTO } from "@raisk/shared";
import { RandomBot } from "./bots/random-bot";
import { GreedyBot } from "./bots/greedy-bot";
import { TurtlenatorBot } from "./bots/turtlenator-bot";
import { HavocBot } from "./bots/havoc-bot";
import { DiplomatBot } from "./bots/diplomat-bot";

export interface Agent {
  decide(state: GameStateDTO): Promise<ActionDTO | null>;
}

export type AgentFactory = (config: AgentConfig, playerId: string) => Agent;

export const createAgent: AgentFactory = (config, playerId): Agent => {
  const difficulty = config.difficulty ?? "medium";

  switch (config.type) {
    case "bot:random":
      return new RandomBot(playerId, difficulty);
    case "bot:greedy":
      return new GreedyBot(playerId, difficulty);
    case "bot:turtle":
      return new TurtlenatorBot(playerId, difficulty);
    case "bot:havoc":
      return new HavocBot(playerId, difficulty);
    case "bot:diplomat":
      return new DiplomatBot(playerId, difficulty);
    default:
      return new RandomBot(playerId, "medium");
  }
};
