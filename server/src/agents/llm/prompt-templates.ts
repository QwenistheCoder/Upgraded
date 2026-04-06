import { GameStateDTO } from "@raisk/shared";

export function buildSystemPrompt(strategy?: string, directives?: string): string {
  return `You are playing a game of Risk (the board game). Your goal is to win by conquering all territories or being the last player standing.

## Rules Summary
- The game has 3 phases: DRAFT (place troops), ATTACK (conquer territories), FORTIFY (reposition troops)
- In DRAFT: place troops one at a time on territories you own
- In ATTACK: attack adjacent enemy territories. Roll dice - attacker up to 3, defender up to 2. Ties go to defender.
- After conquering, you MUST occupy the territory (move troops to it)
- In FORTIFY: move troops between your connected territories once, then end turn
- You receive reinforcements each turn based on territories owned (min 3) + continent bonuses
- Trade card sets of 3 matching types or 1-of-each for bonus troops

${strategy === "aggressive" ? "You are aggressive. Prioritize expansion and attacking. Take risks." : ""}
${strategy === "conservative" ? "You are cautious. Only attack when heavily favored. Fortify defensively." : ""}
${strategy === "balanced" || !strategy ? "Play balanced - expand when advantageous, defend when threatened." : ""}

${directives ? `## Custom Directives\n${directives}` : ""}

## Response Format
Respond ONLY with a valid JSON object. No explanation. The format:
\`\`\`json
{"type": "action_type", "from_id": "territory_id", "to_id": "territory_id", "armies": 1}
\`\`\`

Valid action types: place_troops, attack, blitz, fortify, occupy, end_attack, end_turn, card_trade, nuke
For nuke: {"type": "nuke", "to_id": "territory_id"}
For card_trade: {"type": "card_trade", "card_indices": [0, 1, 2]}`;
}

export function buildUserPrompt(state: GameStateDTO): string {
  const player = state.players[state.current_player_id];
  const phase = state.phase;
  const owned = Object.entries(state.territories)
    .filter(([, t]) => t.owner === state.current_player_id)
    .map(([id, t]) => `${id}: ${t.armies} armies${t.irradiated ? " (IRRADIATED)" : ""}`)
    .join("\n  ");

  const enemies = Object.entries(state.territories)
    .filter(([, t]) => t.owner !== state.current_player_id)
    .map(([id, t]) => `${id} (${t.owner}): ${t.armies} armies${t.irradiated ? " (IRRADIATED)" : ""}`)
    .join("\n  ");

  return `## Current State
Phase: ${phase}
Turn: ${state.turn_number}
Your name: ${player?.name}
Troops to place: ${state.troops_to_place}
Your cards: ${player?.card_count ?? 0} (${player?.cards?.length ?? 0} held)
Your nukes: ${player?.nukes_remaining ?? 0}

## Your Territories
  ${owned}

## Enemy Territories
  ${enemies}

## Game State
Status: ${state.status}
Phase: ${phase}

${state.pending_occupation ? `## Pending Occupation
You must occupy ${state.pending_occupation.to_id} from ${state.pending_occupation.from_id}.
You must move between ${state.pending_occupation.min_armies} and ${state.pending_occupation.max_armies} armies.
` : ""}

Make your move. Return ONLY valid JSON with no explanation.`;
}
