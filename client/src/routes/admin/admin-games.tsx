import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminGames() {
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/games/active").then((r) => r.json()),
      fetch("/api/admin/games/history").then((r) => r.json()),
    ]).then(([active, history]) => setGames([...active, ...history]))
      .catch(() => setGames([]));
  }, []);

  const cancelGame = async (gameId: string) => {
    await fetch(`/api/admin/games/${gameId}`, { method: "DELETE" });
    setGames((prev) => prev.filter((g) => g.id !== gameId));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Game Management</h1>
      {games.length === 0 ? (
        <div className="card text-center py-12 text-surface-500">No games found.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-800 text-left text-surface-500">
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Turns</th>
                <th className="py-2 px-3">Created</th>
                <th className="py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <tr key={g.id} className="border-b border-surface-800/50">
                  <td className="py-2 px-3 font-mono">
                    <Link to={`/games/${g.id}`} className="text-brand-400 hover:underline">{g.id}</Link>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      g.status === "RUNNING" ? "bg-green-500/20 text-green-400" :
                      g.status === "COMPLETE" ? "bg-blue-500/20 text-blue-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>{g.status}</span>
                  </td>
                  <td className="py-2 px-3">{g.turn_count ?? 0}</td>
                  <td className="py-2 px-3 text-surface-500">{new Date(g.created_at).toLocaleDateString()}</td>
                  <td className="py-2 px-3">
                    {g.status === "RUNNING" && (
                      <button onClick={() => cancelGame(g.id)} className="text-xs text-red-400 hover:underline">Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
