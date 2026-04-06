import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { lobbiesApi } from "@/api/lobbies-api";
import { Button } from "@/components/ui/button";

export default function LobbyList() {
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lobbiesApi.list().then((res) => { setLobbies(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lobbies</h1>
        <div className="flex gap-2">
          <Link to="/lobbies/create"><Button size="sm">Create Lobby</Button></Link>
        </div>
      </div>

      {loading ? <div className="text-surface-500">Loading...</div> :
        lobbies.length === 0 ? (
          <div className="card text-center py-12 text-surface-500">
            No open lobbies. Create one or join by code.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {lobbies.map((lobby) => (
              <Link key={lobby.id} to={`/lobbies/${lobby.id}`} className="card card-hover block">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{lobby.name}</h3>
                    <div className="text-xs text-surface-500 mt-1">
                      Code: {lobby.code}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    lobby.status === "WAITING" ? "bg-green-500/20 text-green-400" :
                    lobby.status === "RUNNING" ? "bg-blue-500/20 text-blue-400" :
                    "bg-surface-700 text-surface-400"
                  }`}>{lobby.status}</span>
                </div>
                <div className="mt-3 text-xs text-surface-500">
                  {lobby.slots?.filter((s: any) => s.agent_config).length ?? 0}/6 players
                </div>
              </Link>
            ))}
          </div>
          )}
    </div>
  );
}
