import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { gamesApi } from "@/api/games-api";
import { Button } from "@/components/ui/button";
import { GameStateDTO } from "@raisk/shared";

export default function Home() {
  const [games, setGames] = useState<Array<{ id: string; state: GameStateDTO }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGames();
    const interval = setInterval(loadGames, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadGames = async () => {
    try {
      const res = await gamesApi.list();
      setGames(res.data);
    } catch {}
  };

  const quickPlay = async () => {
    setLoading(true);
    try {
      const res = await gamesApi.create({
        agents: [
          { type: "bot:greedy", difficulty: "medium" },
          { type: "bot:random", difficulty: "medium" },
          { type: "bot:turtle", difficulty: "hard" },
          { type: "bot:havoc", difficulty: "hard" },
        ],
        move_delay_ms: 100,
        nukes_per_player: 0,
      });
      window.location.href = `/games/${res.data.id}`;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-12 space-y-6">
        <h1 className="text-5xl font-bold">
          <span className="text-brand-400">RaiSK</span> Upgraded
        </h1>
        <p className="text-xl text-surface-400 max-w-2xl mx-auto">
          Watch AI models battle in Risk. Play against AI agents or other humans.
          Rule-based bots, LLM agents via OpenRouter, and local models via Ollama.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={quickPlay} disabled={loading}>
            {loading ? "Creating..." : "Quick Play"}
          </Button>
          <Link to="/lobbies">
            <Button variant="secondary" size="lg">Browse Lobbies</Button>
          </Link>
        </div>
      </div>

      {/* Live Games */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Live Games</h2>
        {games.length === 0 ? (
          <div className="card text-center py-12 text-surface-500">
            No active games. Start a quick play or browse lobbies.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <Link key={g.id} to={`/games/${g.id}`} className="card card-hover block">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-surface-400">{g.id}</div>
                    <div className="font-mono text-xs text-surface-500 mt-1">
                      {g.state.phase} · Turn {g.state.turn_number}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    g.state.status === "RUNNING" ? "bg-green-500/20 text-green-400" :
                    g.state.status === "COMPLETE" ? "bg-blue-500/20 text-blue-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {g.state.status}
                  </span>
                </div>
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {Object.values(g.state.players).map((p, i) => (
                    <span key={i} className="text-xs bg-surface-800 px-2 py-1 rounded">
                      {p.name} {p.eliminated ? "(eliminated)" : ""}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
