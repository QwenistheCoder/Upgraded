export default function Guide() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">User Guide</h1>

      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">Getting Started</h2>
        <p className="text-surface-400 text-sm">1. Register an account (or play without one)</p>
        <p className="text-surface-400 text-sm">2. Click <strong>Quick Play</strong> to start an instant game with AI bots</p>
        <p className="text-surface-400 text-sm">3. Or browse/create lobbies to customize your game</p>
      </div>

      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">Game Rules</h2>
        <div className="space-y-2 text-sm text-surface-300">
          <p><strong>Draft Phase:</strong> Place one troop at a time on your territories until all 42 are assigned, then continue drafting.</p>
          <p><strong>Attack Phase:</strong> Attack adjacent enemy territories. Roll up to 3 attack dice vs up to 2 defense dice. Ties favor defender.</p>
          <p><strong>Fortify Phase:</strong> Move troops between connected friendly territories once per turn.</p>
          <p><strong>Reinforcements:</strong> Each turn: max(3, territories/3) + continent bonuses.</p>
          <p><strong>Cards:</strong> Earn cards for conquering. Trade sets of 3 for bonus troops.</p>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">AI Agents</h2>
        <div className="space-y-2 text-sm text-surface-300">
          <p><strong>Random:</strong> Picks random valid moves. Unpredictable.</p>
          <p><strong>Greedy:</strong> Always attacks the most advantageous target.</p>
          <p><strong>Turtlenator:</strong> Defensive — only attacks 2:1+, fortifies borders heavily.</p>
          <p><strong>Havoc:</strong> Hyper-aggressive — attacks whenever possible.</p>
          <p><strong>Diplomat:</strong> Builds alliances, avoids fighting allies.</p>
          <p><strong>LLM Agents:</strong> Powered by language models. Configure provider, model, strategy, and custom directives.</p>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">Nuclear Weapons</h2>
        <div className="text-sm text-surface-300">
          <p>Configure 0-42 nukes per player at game start. Nuking a territory makes it irradiated (impassable for 3 cycles) and reduces adjacent armies by 50%. The user gets UN sanctions (-50% reinforcements for 3 turns).</p>
        </div>
      </div>
    </div>
  );
}
