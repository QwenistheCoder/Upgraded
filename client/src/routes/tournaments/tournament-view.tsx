import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TournamentView() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    if (!tournamentId) return;
    Promise.all([
      fetch(`/api/tournaments/${tournamentId}`).then((r) => r.json()),
      fetch(`/api/tournaments/${tournamentId}/games`).then((r) => r.json()),
    ]).then(([t, g]) => { setTournament(t); setGames(g); });
  }, [tournamentId]);

  if (!tournament) return <div className="text-center py-20 text-surface-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <span className="text-sm text-surface-500">{tournament.status}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>← Back</Button>
      </div>

      {/* Standings */}
      {tournament.standings && (
        <div className="card">
          <h3 className="font-medium mb-3">Standings</h3>
          <div className="space-y-1">
            {Object.entries(tournament.standings).map(([key, val]: [string, any]) => (
              <div key={key} className="flex justify-between text-sm">
                <span>{key}</span>
                <span>{val.points} pts ({val.wins}W-{val.losses}L)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Games */}
      <div>
        <h3 className="font-medium mb-3">Games</h3>
        {games.length === 0 ? (
          <div className="text-sm text-surface-500">No games yet.</div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {games.map((g) => (
              <Link key={g.id} to={`/games/${g.id}`} className="card card-hover block text-sm">
                <div className="flex justify-between">
                  <span>{g.id}</span>
                  <span className="text-surface-500">{g.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
