import { gameRegistry } from "./src/scheduler/game-scheduler";
import { createAgent } from "./src/agents/agent-factory";

async function main() {
  const instance = gameRegistry.create({
    agents: [
      { type: "bot:random" as const },
      { type: "bot:greedy" as const },
    ],
    move_delay_ms: 0,
    nukes_per_player: 0,
    max_turns: 5000,
  });

  // Run with lower action limit to observe what happens
  const state = instance.engine.getState();
  console.log("Initial troops_to_place:", state.troops_to_place);
  console.log("Phase:", state.phase);
  console.log("Current:", state.players[state.current_player_id].name);

  // Run just 100 actions and observe
  let actions = 0;
  while (instance.engine.getState().status === "RUNNING" && actions < 100) {
    const st = instance.engine.getState();
    const playerIdx = parseInt(st.current_player_id.split("_")[1]);
    const agentConfig = instance.engine.getConfig().agents[playerIdx];
    const agent = createAgent(agentConfig, st.current_player_id);
    const action = await agent.decide(st);
    if (action) {
      const result = instance.engine.processAction(action, st.current_player_id);
      if (!result) {
        console.log(`INVALID ACTION: ${JSON.stringify(action)} [phase: ${st.phase}, troops: ${st.troops_to_place}]`);
      }
    } else {
      // Auto-fill for stuck phases
      if (st.phase === "ATTACK") instance.engine.processAction({ type: "end_attack" }, st.current_player_id);
      else if (st.phase === "FORTIFY") instance.engine.processAction({ type: "end_turn" }, st.current_player_id);
    }
    actions++;
  }

  const fs = instance.engine.getState();
  console.log("\n--- After 100 actions ---");
  console.log("Status:", fs.status, "Phase:", fs.phase, "Turn:", fs.turn_number);
  console.log("Troops to place:", fs.troops_to_place);
  console.log("Current player:", fs.players[fs.current_player_id].name);
  for (const [id, p] of Object.entries(fs.players)) {
    const n = Object.values(fs.territories).filter(t => t.owner === id).length;
    console.log(`  ${p.name}: ${n} territories, eliminated: ${p.eliminated}`);
  }
}

main().catch(e => console.error(e));
