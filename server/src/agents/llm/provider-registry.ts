export interface BuiltinProvider {
  id: string;
  name: string;
  baseUrl: string;
  protocol: "openai" | "anthropic";
  models: string[];
  modelHeader?: string;
  authHeader?: string;
}

export const BUILTIN_PROVIDERS: Record<string, BuiltinProvider> = {
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    protocol: "anthropic",
    models: ["claude-sonnet-4-6-20250628", "claude-opus-4-6-20250628", "claude-haiku-4-5-20251001"],
    authHeader: "x-api-key",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    protocol: "openai",
    models: ["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "o3-mini"],
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    protocol: "openai",
    models: ["anthropic/claude-sonnet-4", "openai/gpt-4o", "google/gemini-2.5-pro", "meta-llama/llama-4-maverick"],
    modelHeader: "HTTP-Referer",
  },
  xai: {
    id: "xai",
    name: "xAI",
    baseUrl: "https://api.x.ai/v1",
    protocol: "openai",
    models: ["grok-2", "grok-3"],
  },
  google: {
    id: "google",
    name: "Google AI",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    protocol: "openai",
    models: ["gemini-2.5-pro", "gemini-2.0-flash"],
  },
  mistral: {
    id: "mistral",
    name: "Mistral AI",
    baseUrl: "https://api.mistral.ai/v1",
    protocol: "openai",
    models: ["mistral-large-latest", "mistral-medium-latest", "codestral-latest"],
  },
  groq: {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    protocol: "openai",
    models: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
  },
  together: {
    id: "together",
    name: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    protocol: "openai",
    models: ["meta-llama/Llama-3-70b-chat-hf", "mistralai/Mixtral-8x7B-Instruct-v0.1"],
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    protocol: "openai",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  cohere: {
    id: "cohere",
    name: "Cohere",
    baseUrl: "https://api.cohere.ai/v1",
    protocol: "openai",
    models: ["command-r-plus", "command-r"],
  },
};

export function getProvider(providerId: string): BuiltinProvider | undefined {
  return BUILTIN_PROVIDERS[providerId];
}

export function getAllProviders(): BuiltinProvider[] {
  return Object.values(BUILTIN_PROVIDERS);
}
