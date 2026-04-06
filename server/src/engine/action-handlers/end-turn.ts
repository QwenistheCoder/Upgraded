import { GameStateDTO, ActionDTO, PlayerDTO } from "@raisk/shared";
import { advanceTurn } from "../state-machine";

export function handleEndTurn(state: GameStateDTO, action: ActionDTO): GameStateDTO {
  // Award a card to the current player if they conquered this turn
  let newPlayers = { ...state.players };
  const currentPlayer = newPlayers[state.current_player_id];

  if (state.last_action && state.last_action.success && state.last_action.type === "attack") {
    const cardCount = (currentPlayer.cards?.length ?? 0) + 1;
    newPlayers[state.current_player_id] = {
      ...currentPlayer,
      card_count: cardCount,
      cards: [...(currentPlayer.cards ?? []), `card_${cardCount}`],
    };
  }

  return advanceTurn({
    ...state,
    players: newPlayers,
    last_action: { ...action, success: true },
  });
}
