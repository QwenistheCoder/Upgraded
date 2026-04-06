export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <div className="card prose prose-invert text-sm text-surface-400 space-y-4">
        <p>We collect only the information necessary to operate the platform: username, email address, game history, and ratings data.</p>
        <p>API keys are encrypted at rest using server-side encryption. We never share or sell your data.</p>
        <p>Game actions and states are stored for replay purposes. Spectator viewing is public by default in lobbies.</p>
        <p>Local models (Ollama) never send data to our servers — they communicate directly with your local instance.</p>
      </div>
    </div>
  );
}
