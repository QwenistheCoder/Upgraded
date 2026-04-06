import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { gamesApi } from "@/api/games-api";
import { RiskMap } from "@/components/game/risk-map";
import { GameStateDTO } from "@raisk/shared";
import { Button } from "@/components/ui/button";

export default function GameReplay() {
  const { gameId } = useParams<{ gameId: string }>();
  const [snapshots, setSnapshots] = useState<GameStateDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);

  useEffect(() => {
    if (!gameId) return;
    gamesApi.snapshots(gameId).then((res) => {
      const snaps = res.data.map((s: any) => s.state);
      setSnapshots(snaps);
      setCurrentIndex(snaps.length - 1);
    });
  }, [gameId]);

  useEffect(() => {
    if (!playing || snapshots.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => {
        if (i < snapshots.length - 1) return i + 1;
        setPlaying(false);
        return i;
      });
    }, speed);
    return () => clearInterval(interval);
  }, [playing, speed, snapshots.length]);

  const current = snapshots[currentIndex];
  if (!current) return <div className="text-center py-20 text-surface-500">No snapshots found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Replay — Game {gameId}</h1>
        <Button variant="ghost" size="sm" onClick={() => window.location.href = `/games/${gameId}`}>
          ← Back to Live
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 bg-surface-900 p-3 rounded-lg">
        <Button variant="secondary" size="sm" onClick={() => setCurrentIndex(0)}>⏮</Button>
        <Button variant="secondary" size="sm" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}>◀</Button>
        <Button variant="primary" size="sm" onClick={() => setPlaying(!playing)}>
          {playing ? "⏸" : "▶"}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setCurrentIndex(Math.min(snapshots.length - 1, currentIndex + 1))}>▶</Button>
        <span className="text-sm text-surface-400">{currentIndex + 1} / {snapshots.length}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-surface-500">Speed:</span>
          <input type="range" min="100" max="2000" step="100" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-24" />
        </div>
      </div>

      <RiskMap state={current} />

      {/* Seek bar */}
      <input
        type="range"
        min={0}
        max={snapshots.length - 1}
        value={currentIndex}
        onChange={(e) => { setCurrentIndex(Number(e.target.value)); setPlaying(false); }}
        className="w-full"
      />
    </div>
  );
}
