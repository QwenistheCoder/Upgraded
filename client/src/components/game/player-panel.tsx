import { PLAYER_COLORS } from "@raisk/shared";
import { GameStateDTO, PlayerDTO } from "@raisk/shared";

export function PlayerPanel({ state }: { state: GameStateDTO }) {
  const playerIds = Object.keys(state.players);

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-surface-200">Players</h3>
      {playerIds.map((id, i) => {
        const player = state.players[id];
        const isCurrent = id === state.current_player_id;
        return (
          <div
            key={id}
            className={`p-3 rounded-lg border transition-all ${
              player.eliminated ? "opacity-40" :
              isCurrent ? "border-brand-500 bg-brand-500/10" : "border-surface-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
              />
              <span className="font-medium text-sm">{player.name}</span>
              {isCurrent && state.status === "RUNNING" && (
                <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">
                  Turn
                </span>
              )}
              {player.eliminated && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                  Eliminated
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-surface-500 flex justify-between">
              <span>{player.card_count} cards</span>
              {player.nukes_remaining !== undefined && player.nukes_remaining > 0 && (
                <span>{player.nukes_remaining} nukes</span>
              )}
              {player.sanctioned_turns && player.sanctioned_turns > 0 && (
                <span className="text-yellow-400">{player.sanctioned_turns}T sanctioned</span>
              )}
            </div>
            {/* Territory count */}
            <div className="mt-1 text-xs text-surface-500">
              Territories: {Object.values(state.territories).filter(t => t.owner === id).length}
            </div>
          </div>
        );
      })}

      {/* Game info */}
      <div className="pt-4 border-t border-surface-800 space-y-1 text-sm text-surface-500">
        <div>Phase: <span className="text-surface-300">{state.phase}</span></div>
        <div>Turn: <span className="text-surface-300">{state.turn_number}</span></div>
        {state.troops_to_place > 0 && (
          <div>To place: <span className="text-surface-300">{state.troops_to_place}</span></div>
        )}
        <div>Status: <span className="text-surface-300">{state.status}</span></div>
        {state.winner_id && state.players[state.winner_id] && (
          <div className="text-green-400 font-medium">
            Winner: {state.players[state.winner_id].name}
          </div>
        )}
      </div>
    </div>
  );
}
