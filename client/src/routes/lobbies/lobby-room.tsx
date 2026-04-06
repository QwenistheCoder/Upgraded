import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { lobbiesApi } from "@/api/lobbies-api";
import { gamesApi } from "@/api/games-api";
import { AgentSelector } from "@/components/game/agent-selector";
import { Button } from "@/components/ui/button";
import { AgentConfig } from "@raisk/shared";

export default function LobbyRoom() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const [lobby, setLobby] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!lobbyId) return;
    lobbiesApi.get(lobbyId).then((res) => { setLobby(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lobbyId]);

  const handleStart = async () => {
    if (!lobby || !lobby.slots) return;
    setStarting(true);
    try {
      const agents = lobby.slots
        .sort((a: any, b: any) => a.slot_index - b.slot_index)
        .map((s: any) => s.agent_config);
      const res = await gamesApi.create({
        agents,
        move_delay_ms: lobby.config?.move_delay_ms ?? 200,
        nukes_per_player: lobby.config?.nukes_per_player ?? 0,
      });
      navigate(`/games/${res.data.id}`);
    } catch {
      setStarting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-surface-500">Loading lobby...</div>;
  if (!lobby) return <div className="text-center py-20 text-red-400">Lobby not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{lobby.name}</h1>
        <div className="text-sm text-surface-500">Code: {lobby.code}</div>
      </div>

      <div className="space-y-3">
        {lobby.slots?.map((slot: any, i: number) => (
          <div key={slot.id} className="flex items-center gap-4 p-3 bg-surface-900 rounded-lg">
            <span className="text-sm text-surface-500 w-16">Slot {i + 1}</span>
            <div className="flex-1">
              <AgentSelector value={slot.agent_config} onChange={(c) => { /* update slot */ }} index={i} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleStart} disabled={starting || (lobby.slots?.length ?? 0) < 2}>
          {starting ? "Starting..." : "Start Game"}
        </Button>
        <Button variant="secondary" onClick={() => navigate("/lobbies")}>Leave</Button>
      </div>
    </div>
  );
}
