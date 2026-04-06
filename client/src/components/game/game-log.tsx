import { ActionDTO } from "@raisk/shared";

export function GameLog({ actions }: { actions: ActionDTO[] }) {
  const displayAction = (action: ActionDTO, index: number) => {
    const labels: Record<string, string> = {
      place_troops: "Placed",
      attack: "Attacked",
      blitz: "Blitzed",
      fortify: "Fortified",
      occupy: "Occupied",
      nuke: "Nuked",
      cross_wasteland_attack: "Crossed Wasteland",
      card_trade: "Traded Cards",
      end_attack: "Ended Attack",
      end_turn: "Ended Turn",
    };

    if (action.type === "place_troops") {
      return `${labels[action.type]} ${action.armies} troops on ${action.to_id}`;
    }
    if (action.type === "attack" || action.type === "blitz") {
      return `${labels[action.type]} ${action.from_id} → ${action.to_id} ${action.success ? "✓" : "✗"}`;
    }
    if (action.type === "fortify") {
      return `${labels[action.type]} ${action.from_id} → ${action.to_id} (${action.armies})`;
    }
    if (action.type === "occupy") {
      return `${labels[action.type]} ${action.to_id} with ${action.armies}`;
    }
    if (action.type === "nuke") {
      return `☢ Nuked ${action.to_id}`;
    }
    return labels[action.type] ?? action.type;
  };

  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-surface-200">Game Log</h3>
      <div className="max-h-60 overflow-y-auto space-y-0.5">
        {actions.length === 0 ? (
          <div className="text-sm text-surface-500 italic">No actions yet</div>
        ) : (
          [...actions].reverse().map((a, i) => (
            <div key={i} className="text-xs text-surface-400 font-mono">
              {displayAction(a, i)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
