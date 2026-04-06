import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface RatingEntry {
  entity_key: string;
  entity_type: string;
  entity_sub_type: string | null;
  elo: number;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<RatingEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = filter === "all" ? "/api/leaderboard" : `/api/leaderboard?type=${filter}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setEntries(d); setLoading(false); })
      .catch(() => { setLoading(false); setEntries([]); });
  }, [filter]);

  const tiers = [
    { name: "Diamond", min: 1800, color: "text-cyan-400" },
    { name: "Platinum", min: 1500, color: "text-purple-400" },
    { name: "Gold", min: 1300, color: "text-yellow-400" },
    { name: "Silver", min: 1100, color: "text-surface-300" },
    { name: "Bronze", min: 0, color: "text-orange-400" },
  ];

  const getTier = (elo: number) => tiers.find((t) => elo >= t.min)!;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leaderboard</h1>

      <div className="flex gap-2">
        {["all", "human", "bot", "model"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f ? "bg-brand-600 text-white" : "bg-surface-800 text-surface-400 hover:text-white"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-surface-500">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="card text-center py-12 text-surface-500">No ratings yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-800 text-left text-surface-500">
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Entity</th>
                <th className="py-2 px-3">Tier</th>
                <th className="py-2 px-3">Elo</th>
                <th className="py-2 px-3">W/L/D</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 50).map((entry, i) => {
                const tier = getTier(entry.elo);
                return (
                  <tr key={entry.entity_key} className="border-b border-surface-800/50 hover:bg-surface-800/30">
                    <td className="py-2 px-3 text-surface-500">{i + 1}</td>
                    <td className="py-2 px-3 font-medium">
                      <Link to={`/players/${entry.entity_key}`} className="hover:text-brand-400">
                        {entry.entity_sub_type ?? entry.entity_type}
                      </Link>
                    </td>
                    <td className={`py-2 px-3 ${tier.color}`}>{tier.name}</td>
                    <td className="py-2 px-3 font-mono">{entry.elo}</td>
                    <td className="py-2 px-3 text-surface-500">
                      {entry.wins}/{entry.losses}/{entry.draws}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
