import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useGameStore } from "@/stores/game-store";
import { gamesApi } from "@/api/games-api";
import { RiskMap } from "@/components/game/risk-map";
import { PlayerPanel } from "@/components/game/player-panel";
import { GameLog } from "@/components/game/game-log";
import { ActionDTO, GameStateDTO } from "@raisk/shared";
import { Button } from "@/components/ui/button";
import { useSSEGame } from "@/hooks/use-sse-game";

export default function GameView() {
  const { gameId } = useParams<{ gameId: string }>();
  const { game, setGame, gameLog, appendLog, reset } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);

  // Load initial state
  useEffect(() => {
    if (!gameId) return;
    reset();
    gamesApi.get(gameId)
      .then((res) => setGame(res.data))
      .catch(() => setError("Game not found"))
      .finally(() => setLoading(false));
  }, [gameId]);

  const handleStateUpdate = useCallback((state: GameStateDTO) => {
    setGame(state);
    if (state.last_action) appendLog(state.last_action);
  }, [setGame, appendLog]);

  const handleEnd = useCallback((state: GameStateDTO) => {
    setGame(state);
    if (state.last_action) appendLog(state.last_action);
  }, [setGame, appendLog]);

  // Connect SSE
  useSSEGame({
    gameId: gameId ?? "",
    onState: handleStateUpdate,
    onEnd: handleEnd,
    autoConnect: !!gameId,
  });

  if (loading) {
    return <div className="text-center py-20 text-surface-500">Loading game...</div>;
  }

  if (error || !game) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-xl mb-4">{error ?? "Game not found"}</p>
        <Link to="/" className="text-brand-400 hover:underline">← Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Game header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Game {gameId}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.location.href = `/games/${gameId}/replay`}>
            Replay
          </Button>
          <Link to="/">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
        </div>
      </div>

      {/* Game status banner */}
      {game.status === "COMPLETE" && (
        <div className={`p-4 rounded-lg text-center ${game.winner_id ? "bg-green-500/10 border border-green-500/30" : "bg-surface-800"}`}>
          <span className="text-xl font-semibold">
            {game.winner_id && game.players[game.winner_id]
              ? `${game.players[game.winner_id].name} Wins!`
              : "Game ended in a draw"
            }
          </span>
          <span className="ml-4 text-sm text-surface-400">({game.turn_number} turns)</span>
        </div>
      )}

      {/* Main content: map + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <RiskMap
            state={game}
            selectedTerritory={selectedTerritory}
            onTerritoryClick={setSelectedTerritory}
          />
        </div>
        <div className="space-y-4">
          <PlayerPanel state={game} />
          <GameLog actions={gameLog} />
        </div>
      </div>
    </div>
  );
}
