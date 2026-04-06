import { useMemo, useState } from "react";
import { TERRITORIES, MAP_EDGES, PLAYER_COLORS } from "@raisk/shared";
import { GameStateDTO } from "@raisk/shared";

interface RiskMapProps {
  state: GameStateDTO;
  selectedTerritory?: string | null;
  onTerritoryClick?: (territoryId: string) => void;
  highlight?: string[];
  mode?: "view" | "place" | "attack" | "fortify";
}

export function RiskMap({ state, selectedTerritory, onTerritoryClick, highlight = [], mode = "view" }: RiskMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const playerIndex = useMemo(() => {
    const indices = new Map<string, number>();
    Object.keys(state.players).forEach((id, i) => indices.set(id, i));
    return indices;
  }, [state.players]);

  const edges = useMemo(() => {
    return MAP_EDGES.map((edge, i) => {
      const from = TERRITORIES.find((t) => t.id === edge.from);
      const to = TERRITORIES.find((t) => t.id === edge.to);
      if (!from || !to) return null;
      return (
        <line
          key={i}
          x1={from.center[0]}
          y1={from.center[1]}
          x2={to.center[0]}
          y2={to.center[1]}
          stroke={edge.type === "wrap" ? "#475569" : "#334155"}
          strokeWidth={edge.type === "wrap" ? 1 : 2}
          strokeDasharray={edge.type === "wrap" ? "6 3" : "none"}
        />
      );
    }).filter(Boolean);
  }, []);

  return (
    <svg
      viewBox="0 0 1000 600"
      className="w-full h-auto bg-surface-900 rounded-xl"
      style={{ maxHeight: "70vh" }}
    >
      {/* Map edges */}
      {edges}

      {/* Territories */}
      {TERRITORIES.map((terr) => {
        const terrState = state.territories[terr.id];
        if (!terrState) return null;

        const pIdx = playerIndex.get(terrState.owner) ?? 0;
        const color = PLAYER_COLORS[pIdx % PLAYER_COLORS.length];
        const isSelected = terr.id === selectedTerritory;
        const isHighlighted = highlight.includes(terr.id);
        const isHovered = terr.id === hovered;

        const interactable = mode === "place" || mode === "attack" || mode === "fortify";
        const clickable = interactable && terrState.owner === state.current_player_id;

        return (
          <g
            key={terr.id}
            onClick={() => clickable && onTerritoryClick?.(terr.id)}
            onMouseEnter={() => setHovered(terr.id)}
            onMouseLeave={() => setHovered(null)}
            className={clickable ? "cursor-pointer" : ""}
          >
            {/* Territory polygon */}
            <polygon
              points={terr.points}
              fill={color}
              fillOpacity={isHovered ? 0.9 : isSelected ? 0.85 : 0.65}
              stroke={isSelected ? "#fff" : isHighlighted ? "#fbbf24" : "#1e293b"}
              strokeWidth={isSelected || isHighlighted ? 3 : 1.5}
            />
            {/* Army count at center */}
            <text
              x={terr.center[0]}
              y={terr.center[1] - 4}
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              fill="white"
              stroke="#000"
              strokeWidth="0.5"
            >
              {terrState.armies}
            </text>
            {/* Irradiated indicator */}
            {terrState.irradiated && (
              <circle
                cx={terr.center[0]}
                cy={terr.center[1] + 10}
                r="6"
                fill="#f59e0b"
                opacity="0.8"
              >
                <title>Irradiated</title>
              </circle>
            )}
            {/* Hover tooltip */}
            {isHovered && (
              <g transform={`translate(${terr.center[0]}, ${Math.max(30, terr.center[1] - 40)})`}>
                <rect x="-50" y="-14" width="100" height="28" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text x="0" y="4" textAnchor="middle" fontSize="11" fill="white">
                  {terr.name}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
