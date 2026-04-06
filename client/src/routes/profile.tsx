import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"info" | "keys" | "providers">("info");

  if (!user) return <div className="text-center py-20 text-surface-500">Please login to view your profile.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-900 p-1 rounded-lg w-fit">
        {(["info", "keys", "providers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              tab === t ? "bg-brand-600 text-white" : "text-surface-400 hover:text-white"
            }`}
          >
            {t === "info" ? "Info" : t === "keys" ? "API Keys" : "Providers"}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === "info" && (
        <div className="card space-y-4">
          <div>
            <div className="text-sm text-surface-500">Username</div>
            <div className="text-lg font-medium">{user.username}</div>
          </div>
          <div>
            <div className="text-sm text-surface-500">Email</div>
            <div className="text-lg font-medium">{user.email}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-surface-500">Email verified:</span>
            <span className={`text-sm ${user.email_verified ? "text-green-400" : "text-yellow-400"}`}>
              {user.email_verified ? "Yes" : "No"}
            </span>
          </div>
          <div>
            <div className="text-sm text-surface-500">Default Elo</div>
            <div className="font-mono text-lg">{user.elo_default ?? 1000}</div>
          </div>
          <div className="text-sm text-surface-500">Joined: {new Date(user.created_at).toLocaleDateString()}</div>
        </div>
      )}

      {/* API Keys tab */}
      {tab === "keys" && <ApiKeysSection />}

      {/* Providers tab */}
      {tab === "providers" && <ProvidersSection />}
    </div>
  );
}

function ApiKeysSection() {
  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">API Keys</h2>
      <p className="text-sm text-surface-500">Store API keys for LLM agents. Keys are encrypted at rest.</p>
      {["anthropic", "openai", "openrouter", "xai", "google", "mistral"].map((provider) => (
        <div key={provider} className="flex items-center gap-3">
          <label className="w-28 text-sm capitalize text-surface-400">{provider}</label>
          <input type="password" className="input-field flex-1" placeholder={`sk-${provider}-...`} />
          <Button size="sm">Save</Button>
        </div>
      ))}
    </div>
  );
}

function ProvidersSection() {
  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">Custom Providers</h2>
      <p className="text-sm text-surface-500">Add any OpenAI-compatible API endpoint as a custom provider.</p>
      <div className="text-sm text-surface-500 italic">No custom providers configured yet.</div>
      <Button size="sm">+ Add Provider</Button>
    </div>
  );
}
