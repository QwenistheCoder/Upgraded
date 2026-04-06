import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats({ users: 0, active_games: 0, total_games: 0, lobbies: 0 }));
  }, []);

  const cards = stats ? [
    { label: "Users", value: stats.users ?? 0, color: "text-blue-400" },
    { label: "Active Games", value: stats.active_games ?? 0, color: "text-green-400" },
    { label: "Total Games", value: stats.total_games ?? 0, color: "text-yellow-400" },
    { label: "Lobbies", value: stats.lobbies ?? 0, color: "text-purple-400" },
  ] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div className="text-sm text-surface-500">{c.label}</div>
            <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <a href="/admin/users" className="btn-primary inline-block">Manage Users</a>
        <a href="/admin/games" className="btn-secondary inline-block">Manage Games</a>
      </div>
    </div>
  );
}
