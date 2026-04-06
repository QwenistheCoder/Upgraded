import { GameStateDTO, PlayerDTO, TerritoryStateDTO, AgentConfig, GameConfig, ActionDTO } from "@raisk/shared";
import { TERRITORIES } from "@raisk/shared";

/**
 * Initial territory distribution: random round-robin assignment.
 */
export function distributeTerritories(
  playerIds: string[],
  seed?: number
): Record<string, TerritoryStateDTO> {
  const territories: Record<string, TerritoryStateDTO> = {};
  const shuffled = [...TERRITORIES].map((t) => t.id);

  // Simple Fisher-Yates shuffle with seed
  let s = seed ?? Date.now();
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  for (let i = 0; i < shuffled.length; i++) {
    const ownerId = playerIds[i % playerIds.length];
    territories[shuffled[i]] = { owner: ownerId, armies: 0 };
  }

  return territories;
}

/**
 * Create initial player records.
 */
export function createPlayers(
  agents: AgentConfig[]
): Record<string, PlayerDTO> {
  const players: Record<string, PlayerDTO> = {};

  for (let i = 0; i < agents.length; i++) {
    players[`player_${i}`] = {
      name: getPlayerName(agents[i], i),
      card_count: 0,
      eliminated: false,
      nukes_remaining: 0,
      cards: [],
    };
  }

  return players;
}

/**
 * Create the initial draft-phase game state.
 */
export function createInitialState(config: GameConfig): GameStateDTO {
  const agents = config.agents;
  const playerIds = agents.map((_, i) => `player_${i}`);
  const territories = distributeTerritories(playerIds, config.seed);
  const players = createPlayers(agents);

  // Apply nukes
  const nukes = config.nukes_per_player ?? 0;
  for (const id of playerIds) {
    players[id].nukes_remaining = nukes;
  }

  // Initial reinforcements: 1 per unowned territory
  const draftTroops = TERRITORIES.length / playerIds.length;

  return {
    status: "RUNNING",
    phase: "DRAFT",
    turn_number: 1,
    current_player_id: playerIds[0],
    winner_id: null,
    troops_to_place: 1,
    territories,
    players,
    last_action: null,
    pending_occupation: null,
  };
}

function getPlayerName(agent: AgentConfig, index: number): string {
  if (agent.type === "human") return `Player ${index + 1}`;
  if (agent.type === "llm") return agent.model ?? `LLM ${index + 1}`;
  const nameMap: Record<string, string> = {
    "bot:greedy": "Greedy",
    "bot:random": "Random",
    "bot:turtle": "Turtlenator",
    "bot:havoc": "Havoc",
    "bot:diplomat": "Diplomat",
  };
  return nameMap[agent.type] ?? `Bot ${index + 1}`;
}
