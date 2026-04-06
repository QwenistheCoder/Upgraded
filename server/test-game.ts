import { gameRegistry } from "./src/scheduler/game-scheduler";
import { createAgent } from "./src/agents/agent-factory";

async function runGame(name: string, configs: any[], actionLimit: number = 20000) {
  const instance = gameRegistry.create({
    agents: configs,
    move_delay_ms: 0,
    nukes_per_player: 0,
    max_turns: 5000,
  });

  const startTime = Date.now();
  const final = await instance.engine.run(async (playerId, state) => {
    const idx = parseInt(playerId.split("_")[1]);
    const ac = instance.engine.getConfig().agents[idx];
    return createAgent(ac, playerId).decide(state);
  }, actionLimit);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  const winnerName = final.winner_id ? final.players[final.winner_id]?.name : "draw (max turns)";

  console.log(`\n=== ${name} ===`);
  console.log(`Status: ${final.status} | Winner: ${winnerName}`);
  console.log(`Actions: ${instance.engine.getActions().length} | Turns: ${final.turn_number} | Time: ${elapsed}s`);
  for (const [id, p] of Object.entries(final.players)) {
    const t = Object.values(final.territories).filter(x => x.owner === id).length;
    console.log(`  ${p.name}: ${t} terr${p.eliminated ? " (ELIM)" : ""}`);
  }

  // Validation
  const totalTerr = Object.values(final.territories).length;
  const alivePlayers = Object.values(final.players).filter(p => !p.eliminated);

  if (final.status === "COMPLETE") {
    if (final.winner_id && alivePlayers.length === 1) {
      const winTerr = Object.values(final.territories).filter(t => t.owner === final.winner_id).length;
      if (winTerr === 42) { console.log("  ✅ Winner owns all 42 territories"); }
      else { console.log(`  ⚠️  Winner has ${winTerr}/42 territories`); }
    }
    console.log(`  ✅ Game completed successfully`);
  } else if (final.status === "RUNNING") {
    console.log(`  ⚠️  Hit action limit`);
  }

  return final.status === "COMPLETE";
}

async function main() {
  let passed = 0, total = 4;

  if (await runGame("2p Random v Greedy", [
    { type: "bot:random" as const }, { type: "bot:greedy" as const }
  ])) passed++;

  if (await runGame("2p Greedy v Turtle", [
    { type: "bot:greedy" as const }, { type: "bot:turtle" as const, difficulty: "hard" as const }
  ])) passed++;

  if (await runGame("3p Havoc v Greedy v Diplomat", [
    { type: "bot:havoc" as const }, { type: "bot:greedy" as const }, { type: "bot:diplomat" as const }
  ])) passed++;

  if (await runGame("4p All Bots", [
    { type: "bot:random" as const }, { type: "bot:greedy" as const },
    { type: "bot:turtle" as const }, { type: "bot:havoc" as const }
  ])) passed++;

  console.log(`\n✅ ${passed}/${total} games completed`);
}

main().catch(e => console.error(e));
