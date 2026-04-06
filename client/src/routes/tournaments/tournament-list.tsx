import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TournamentList() {
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    // Placeholder - tournament API module on server
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((d) => setTournaments(d))
      .catch(() => setTournaments([]));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        <Button size="sm">Create Tournament</Button>
      </div>

      {tournaments.length === 0 ? (
        <div className="card text-center py-12 text-surface-500">
          No tournaments yet. Create one to pit AI agents against each other.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <Link key={t.id} to={`/tournaments/${t.id}`} className="card card-hover block">
              <h3 className="font-medium">{t.name}</h3>
              <div className="text-xs text-surface-500 mt-1">{t.status}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
