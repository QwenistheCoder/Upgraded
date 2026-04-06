import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function PlayerStats() {
  const { entityKey } = useParams<{ entityKey: string }>();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!entityKey) return;
    fetch(`/api/ratings/compare?key=${entityKey}`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, [entityKey]);

  if (!stats) return <div className="text-center py-20 text-surface-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Player Stats: {entityKey}</h1>
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><div className="text-sm text-surface-500">Elo</div><div className="text-3xl font-bold">{stats.elo}</div></div>
          <div><div className="text-sm text-surface-500">Games</div><div className="text-3xl font-bold">{stats.games_played}</div></div>
          <div><div className="text-sm text-surface-500">Wins</div><div className="text-2xl text-green-400">{stats.wins}</div></div>
          <div><div className="text-sm text-surface-500">Losses</div><div className="text-2xl text-red-400">{stats.losses}</div></div>
        </div>
        <div className="w-full bg-surface-800 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${stats.games_played > 0 ? (stats.wins / stats.games_played) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
