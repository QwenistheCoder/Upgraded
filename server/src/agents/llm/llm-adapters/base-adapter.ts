import { AgentConfig, GameStateDTO, ActionDTO } from "@raisk/shared";
import { buildSystemPrompt, buildUserPrompt } from "../prompt-templates";
import { parseActionFromLLM } from "../response-parser";
import { BUILTIN_PROVIDERS } from "../provider-registry";

export async function callLLM(
  config: AgentConfig,
  state: GameStateDTO
): Promise<ActionDTO | null> {
  const { provider = "anthropic", model = "claude-sonnet-4-6-20250628", api_key, protocol } = config;
  const providerDef = BUILTIN_PROVIDERS[provider];
  const baseUrl = config.base_url || providerDef?.baseUrl || "";
  const wireProtocol = protocol || providerDef?.protocol || "openai";

  const systemPrompt = buildSystemPrompt(config.strategy, config.directives);
  const userPrompt = buildUserPrompt(state);

  let responseText: string;

  if (wireProtocol === "anthropic" || (provider === "anthropic" && !protocol)) {
    responseText = await callAnthrophic(baseUrl, api_key || "", model, systemPrompt, userPrompt);
  } else {
    responseText = await callOpenAI(baseUrl, api_key || "", model, systemPrompt, userPrompt);
  }

  const parsed = parseActionFromLLM(responseText);
  if (parsed && "type" in parsed) {
    return parsed as ActionDTO;
  }

  // Fallback: end attack or end turn
  if (state.phase === "ATTACK") return { type: "end_attack" };
  if (state.phase === "FORTIFY") return { type: "end_turn" };
  return null;
}

async function callOpenAI(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    console.error("OpenAI API error:", res.status, await res.text());
    throw new Error("LLM API call failed");
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function callAnthrophic(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    console.error("Anthropic API error:", res.status, await res.text());
    throw new Error("LLM API call failed");
  }

  const data = await res.json();
  return data.content[0].text;
}
