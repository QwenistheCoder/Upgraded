import { GameStateDTO, ActionDTO } from "@raisk/shared";
import { getTradeBonus } from "@raisk/shared";

export function handleCardTrade(state: GameStateDTO, action: ActionDTO): GameStateDTO {
  const player = state.players[state.current_player_id];
  const indices = action.card_indices ?? [];
  const tradeSize = indices.length;

  const bonus = getTradeBonus(tradeSize);

  // Remove traded cards
  const newCards = (player.cards ?? []).filter((_, i) => !indices.includes(i));

  const newPlayers = {
    ...state.players,
    [state.current_player_id]: {
      ...player,
      card_count: newCards.length,
      cards: newCards,
    },
  };

  return {
    ...state,
    players: newPlayers,
    last_action: { ...action, success: true, armies: bonus },
    troops_to_place: state.troops_to_place + bonus,
  };
}
