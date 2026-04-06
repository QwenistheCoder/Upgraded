import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { lobbiesApi } from "@/api/lobbies-api";
import { AgentConfig } from "@raisk/shared";
import { AgentSelector } from "@/components/game/agent-selector";
import { Button } from "@/components/ui/button";

export default function LobbyCreate() {
  const navigate = useNavigate();
  const [name, setName] = useState("My Game");
  const [agents, setAgents] = useState<AgentConfig[]>([
    { type: "bot:greedy", difficulty: "medium" },
    { type: "bot:random", difficulty: "medium" },
  ]);
  const [moveDelay, setMoveDelay] = useState(200);
  const [nukes, setNukes] = useState(0);
  const [loading, setLoading] = useState(false);

  const updateAgent = (index: number, config: AgentConfig) => {
    const newAgents = [...agents];
    newAgents[index] = config;
    setAgents(newAgents);
  };

  const addSlot = () => setAgents([...agents, { type: "bot:random" }]);
  const removeSlot = (i: number) => setAgents(agents.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (agents.length < 2) return;
    setLoading(true);
    try {
      const res = await lobbiesApi.create({
        name,
        agents,
        move_delay_ms: moveDelay,
        nukes_per_player: nukes,
      });
      navigate(`/lobbies/${res.data.id}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create Lobby</h1>
      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="block text-sm mb-1 text-surface-400">Name</label>
          <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-surface-400">Players ({agents.length}/6)</label>
            {agents.length < 6 && <Button type="button" size="sm" variant="ghost" onClick={addSlot}>+ Add</Button>}
          </div>
          <div className="space-y-3">
            {agents.map((agent, i) => (
              <div key={i} className="relative">
                {agents.length > 2 && (
                  <button type="button" className="absolute top-2 right-2 text-red-400 text-sm hover:text-red-300" onClick={() => removeSlot(i)}>✕</button>
                )}
                <AgentSelector value={agent} onChange={(c) => updateAgent(i, c)} index={i} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-surface-400">Move Delay (ms)</label>
            <input type="number" className="input-field" value={moveDelay} onChange={(e) => setMoveDelay(Number(e.target.value))} min={0} max={5000} />
          </div>
          <div>
            <label className="block text-sm mb-1 text-surface-400">Nukes per Player</label>
            <input type="number" className="input-field" value={nukes} onChange={(e) => setNukes(Number(e.target.value))} min={0} max={42} />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading || agents.length < 2}>
          {loading ? "Creating..." : "Create & Enter Lobby"}
        </Button>
      </form>
    </div>
  );
}
