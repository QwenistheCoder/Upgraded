import type { AgentConfig } from "@raisk/shared";

const BOT_TYPES: Array<{ value: AgentConfig["type"]; label: string; desc: string }> = [
  { value: "bot:random", label: "Random", desc: "Picks moves at random" },
  { value: "bot:greedy", label: "Greedy", desc: "Maximizes territory" },
  { value: "bot:turtle", label: "Turtlenator", desc: "Defensive strategy" },
  { value: "bot:havoc", label: "Havoc", desc: "Aggressive attacks" },
  { value: "bot:diplomat", label: "Diplomat", desc: "Builds alliances" },
];

const DIFFICULTIES = ["easy", "medium", "hard", "extreme"] as const;
const STRATEGIES = ["aggressive", "balanced", "conservative"] as const;

interface AgentSelectorProps {
  value: AgentConfig;
  onChange: (config: AgentConfig) => void;
  index: number;
}

export function AgentSelector({ value, onChange, index }: AgentSelectorProps) {
  return (
    <div className="p-3 bg-surface-900 rounded-lg border border-surface-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">Slot {index + 1}</span>
        <select
          className="input-field w-auto text-sm"
          value={value.type}
          onChange={(e) => onChange({
            ...value,
            type: e.target.value as AgentConfig["type"],
            model: e.target.value === "llm" ? (value.model || "claude-sonnet-4-6-20250628") : undefined,
            difficulty: e.target.value.startsWith("bot:") ? (value.difficulty || "medium") : undefined,
          })}
        >
          <option value="human">Human</option>
          {BOT_TYPES.map((b) => (
            <option key={b.value} value={b.value}>{b.label} ({b.desc})</option>
          ))}
          <option value="llm">LLM Agent</option>
        </select>
      </div>

      {value.type.startsWith("bot:") && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-surface-500">Difficulty:</span>
          <select
            className="input-field w-auto text-xs"
            value={value.difficulty ?? "medium"}
            onChange={(e) => onChange({ ...value, difficulty: e.target.value as any })}
          >
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}

      {value.type === "llm" && (
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <span className="text-xs text-surface-500">Provider:</span>
            <select
              className="input-field w-auto text-xs"
              value={value.provider ?? "openrouter"}
              onChange={(e) => onChange({ ...value, provider: e.target.value })}
            >
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openrouter">OpenRouter</option>
              <option value="openai">OpenAI (GPT)</option>
              <option value="xai">xAI (Grok)</option>
              <option value="google">Google (Gemini)</option>
              <option value="mistral">Mistral AI</option>
              <option value="groq">Groq</option>
              <option value="deepseek">DeepSeek</option>
              <option value="local">Local (Ollama)</option>
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-surface-500">Model:</span>
            <input
              type="text"
              className="input-field w-40 text-xs"
              placeholder="model-id"
              value={value.model ?? ""}
              onChange={(e) => onChange({ ...value, model: e.target.value })}
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-surface-500">API Key:</span>
            <input
              type="password"
              className="input-field w-40 text-xs"
              placeholder="sk-..."
              value={value.api_key ?? ""}
              onChange={(e) => onChange({ ...value, api_key: e.target.value })}
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-surface-500">Strategy:</span>
            <select
              className="input-field w-auto text-xs"
              value={value.strategy ?? "balanced"}
              onChange={(e) => onChange({ ...value, strategy: e.target.value as any })}
            >
              {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-surface-500">Directives:</span>
            <input
              type="text"
              className="input-field text-xs"
              placeholder="Custom instructions for the LLM..."
              value={value.directives ?? ""}
              onChange={(e) => onChange({ ...value, directives: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
