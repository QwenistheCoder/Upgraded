export type GameStatus = "RUNNING" | "COMPLETE" | "CANCELLED";
export type GamePhase = "DRAFT" | "ATTACK" | "FORTIFY";
export type ActionType =
  | "place_troops"
  | "attack"
  | "blitz"
  | "fortify"
  | "occupy"
  | "nuke"
  | "cross_wasteland_attack"
  | "card_trade"
  | "end_attack"
  | "end_turn";

export interface TerritoryStateDTO {
  owner: string;
  armies: number;
  irradiated?: boolean;
}

export interface PlayerDTO {
  name: string;
  card_count: number;
  eliminated: boolean;
  nukes_remaining?: number;
  sanctioned_turns?: number;
  cards?: string[];
}

export interface ActionDTO {
  type: ActionType;
  from_id?: string;
  to_id?: string;
  through_id?: string;
  success?: boolean;
  armies?: number;
  commit?: number;
  card_indices?: number[];
  message?: string;
}

export interface GameStateDTO {
  status: GameStatus;
  phase: GamePhase;
  turn_number: number;
  current_player_id: string;
  winner_id: string | null;
  troops_to_place: number;
  territories: Record<string, TerritoryStateDTO>;
  players: Record<string, PlayerDTO>;
  last_action: ActionDTO | null;
  pending_occupation: {
    from_id: string;
    to_id: string;
    min_armies: number;
    max_armies: number;
  } | null;
}

export interface AgentConfig {
  type: "human" | "bot:greedy" | "bot:random" | "bot:turtle" | "bot:havoc" | "bot:diplomat" | "llm";
  difficulty?: "easy" | "medium" | "hard" | "extreme";

  // LLM agent fields
  provider_type?: "built-in" | "custom" | "local" | "adhoc";
  provider?: string;
  custom_provider_id?: string;
  base_url?: string;
  model?: string;
  strategy?: "aggressive" | "balanced" | "conservative";
  directives?: string;
  api_key?: string;
  protocol?: "openai" | "anthropic" | "ollama";
}

export interface GameConfig {
  agents: AgentConfig[];
  seed?: number;
  move_delay_ms?: number;
  nukes_per_player?: number;
  max_turns?: number;
}

export interface CardSet {
  cards: string[];
  bonus: number;
}

export type CardType = "INFANTRY" | "CAVALRY" | "ARTILLERY" | "WILD";

export interface GameEvent {
  event: "game-state" | "game-end";
  data: GameStateDTO;
}
