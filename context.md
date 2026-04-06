# RaiSK Clone — Project Context
> Based on reverse-engineering of RaiSK (raisk.gg) compiled frontend bundle.
> Extended with planned improvements and new features.

---

## What Is This Project?

A Risk board game platform where AI models battle each other and humans can watch or play. The core concept:
- **Spectator mode**: watch AI vs AI games in real time
- **Play mode**: humans can join and play against AI agents or other humans
- **LLM agents**: language models (Claude, GPT-4, Grok, etc.) make strategic decisions each turn
- **Rule-based bots**: built-in bots available without any API keys

---

## Tech Stack

### Original (RaiSK)
| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Vite |
| State Management | Zustand |
| HTTP Client | Axios (baseURL: `/api`) |
| Realtime | Server-Sent Events (SSE) |
| i18n | i18next (English + German) |
| Backend | Spring Boot 3.3.13 (Java) |
| Auth | JWT token + session token |

### Our Stack (planned)
| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Vite |
| State Management | Zustand |
| HTTP Client | Axios |
| Realtime | Server-Sent Events (SSE) |
| Styling | Tailwind CSS |
| Backend | Node.js / Express (or keep Spring Boot) |
| Database | PostgreSQL |
| Auth | JWT |

---

## Pages / Routes

| Route | Page |
|---|---|
| `/` | Home — live games feed, quick play |
| `/login` | Login |
| `/register` | Register |
| `/verify-email` | Email Verification |
| `/forgot-password` | Forgot Password |
| `/reset-password` | Reset Password |
| `/profile` | User Profile + API Keys + Provider Config |
| `/games/:gameId` | Live Game View |
| `/games/:gameId/replay` | Game Replay |
| `/lobbies` | Browse Lobbies |
| `/lobbies/create` | Create Lobby |
| `/lobbies/join/:code` | Join by Invite Code |
| `/lobbies/:lobbyId` | Lobby Room |
| `/tournaments` | Tournament List |
| `/tournaments/:tournamentId` | Tournament View |
| `/leaderboard` | Elo Leaderboard |
| `/players/:entityKey` | Player / Bot / Model Stats Page |
| `/about` | About |
| `/guide` | User Guide |
| `/changelog` | What's New |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/admin` | Admin Dashboard |
| `/admin/users` | Admin User Management |
| `/admin/games` | Admin Game Management |

---

## API Endpoints

All routes prefixed with `/api`

### Auth
```
POST /auth/login
POST /auth/register
POST /auth/verify-email
POST /auth/forgot-password
POST /auth/reset-password
POST /users/me/resend-verification
```

### User / Profile
```
GET    /users/me
GET    /users/me/api-keys
POST   /users/me/api-keys          (validate & save key)
DELETE /users/me/api-keys/:provider
GET    /users/me/custom-providers           [NEW]
POST   /users/me/custom-providers           [NEW]
PUT    /users/me/custom-providers/:id       [NEW]
DELETE /users/me/custom-providers/:id       [NEW]
```

### Games
```
GET    /games                               (list)
GET    /games/:id                           (get game)
GET    /games/:id/snapshots                 (replay snapshots)
POST   /games/:id/players/:id/action        (submit move)
DELETE /games/:id                           (cancel game)
PATCH  /games/:id/delay                     { move_delay_ms }
```

### Game Streaming (SSE)
```
GET /api/games/:id/stream?token=...
    OR
GET /api/games/:id/stream?sessionToken=...
```
SSE events:
- `game-state` → full `GameStateDTO` as JSON
- `game-end`   → final game state

### Lobbies
```
GET    /lobbies
POST   /lobbies/create
GET    /lobbies/:id
POST   /lobbies/:id/start
POST   /lobbies/:id/join
POST   /lobbies/join/:code
POST   /lobbies/:id/ready
POST   /lobbies/:id/leave
DELETE /lobbies/:id/slots/:slotId/kick
GET    /lobbies/:id/stream                  (SSE: lobby-update, lobby-cancelled)
```

### Tournaments
```
GET  /tournaments
POST /tournaments
GET  /tournaments/:id
GET  /tournaments/:id/games
GET  /tournaments/:id/stats
```

### Leaderboard / Ratings
```
GET /leaderboard
GET /ratings/compare
GET /ratings/recent
GET /config/models                          (available built-in LLM models)
GET /config/providers                       [NEW] (provider registry)
GET /info                                   (version info)
```

### Admin
```
GET    /admin/dashboard
GET    /admin/games/active
GET    /admin/games/history
DELETE /admin/games/:id
GET    /admin/users
POST   /admin/users/:id/promote
POST   /admin/users/:id/demote
POST   /admin/users/:id/badges
DELETE /admin/users/:id/badges/:badgeId
POST   /admin/users/:id/verify-email
POST   /admin/users/:id/unverify-email
```

---

## Game State DTO (SSE payload)

```typescript
interface GameStateDTO {
  status: "RUNNING" | "COMPLETE" | "CANCELLED";
  phase: "DRAFT" | "ATTACK" | "FORTIFY";
  turn_number: number;
  current_player_id: string;
  winner_id: string | null;
  troops_to_place: number;
  territories: Record<string, TerritoryStateDTO>;
  players: Record<string, PlayerDTO>;
  last_action: ActionDTO | null;
  pending_occupation: {
    from_id: string;
    to_id: string;
    min_armies: number;
    max_armies: number;
  } | null;
}

interface TerritoryStateDTO {
  owner: string;        // player id
  armies: number;
  irradiated?: boolean; // nuclear wasteland
}

interface PlayerDTO {
  name: string;
  card_count: number;
  eliminated: boolean;
  nukes_remaining?: number;
  sanctioned_turns?: number;  // UN sanctions remaining
}

interface ActionDTO {
  type: "place_troops" | "attack" | "blitz" | "fortify" |
        "occupy" | "nuke" | "cross_wasteland_attack" | "card_trade";
  from_id?: string;
  to_id?: string;
  success?: boolean;
  armies?: number;
}
```

---

## Action Payloads (POST /games/:id/players/:id/action)

```typescript
// Place troops
{ type: "place_troops", territory_id: string, armies: number }

// Attack
{ type: "attack", from_id: string, to_id: string }

// Blitz (auto-attack until win or can't)
{ type: "blitz", from_id: string, to_id: string }

// Occupy after conquest
{ type: "occupy", from_id: string, to_id: string, armies: number }

// Fortify
{ type: "fortify", from_id: string, to_id: string, armies: number }

// Nuke
{ type: "nuke", to_id: string }

// Cross wasteland attack
{ type: "cross_wasteland_attack", from_id: string, through_id: string, to_id: string, commit: number }

// Card trade
{ type: "card_trade", card_indices: number[] }

// End attack phase
{ type: "end_attack" }

// End turn
{ type: "end_turn" }

// With optional diplomacy message
{ ...action, message: string }
```

---

## Game Creation Payload

```typescript
// Quick Play / Solo
POST /games
{
  agents: AgentConfig[],
  api_keys?: Record<string, string>,   // { "0": "sk-ant-...", "1": "sk-..." }
  seed?: number,
  move_delay_ms?: number,
  nukes_per_player?: number,           // 0-42
  max_turns?: number
}

// Tournament
POST /tournaments
{
  agents: AgentConfig[],
  games_per_matchup: number,
  seed?: number,
  api_keys?: Record<string, string>,
  move_delay_ms?: number,
  nukes_per_player?: number,
  max_turns?: number
}

interface AgentConfig {
  type: "human" | "bot:greedy" | "bot:random" | "bot:turtle" |
        "bot:havoc" | "bot:diplomat" | "llm";
  difficulty?: "easy" | "medium" | "hard" | "extreme";  // bots only

  // LLM agent fields (extended — see LLM Provider System below)
  provider_type?: "builtin" | "custom" | "local";       // [NEW]
  provider?: string;                                     // builtin: "anthropic" | "openai" | "xai" | "google" | "mistral" | "cohere" | ...
  custom_provider_id?: string;                           // [NEW] ref to user's saved custom provider
  base_url?: string;                                     // [NEW] for local/custom on-the-fly
  model?: string;
  strategy?: "aggressive" | "balanced" | "conservative";
  directives?: string;
}
```

---

## Map Data

### Continents
| ID | Name | Bonus | Territories |
|---|---|---|---|
| `north_america` | N. America | +5 | alaska, northwest_territory, greenland, alberta, ontario, quebec, western_us, eastern_us, central_america |
| `south_america` | S. America | +2 | venezuela, peru, brazil, argentina |
| `europe` | Europe | +5 | iceland, great_britain, northern_europe, scandinavia, eastern_europe, western_europe, southern_europe |
| `africa` | Africa | +3 | north_africa, egypt, east_africa, congo, south_africa, madagascar |
| `asia` | Asia | +7 | ural, siberia, yakutsk, kamchatka, irkutsk, mongolia, japan, afghanistan, china, middle_east, india, southeast_asia |
| `australia` | Australia | +2 | indonesia, new_guinea, western_australia, eastern_australia |

### Map Visual Connections (SVG edges)
```javascript
const MAP_EDGES = [
  { from: "alaska",          to: "kamchatka",          type: "wrap"   },
  { from: "greenland",       to: "northwest_territory", type: "direct" },
  { from: "greenland",       to: "ontario",             type: "direct" },
  { from: "greenland",       to: "quebec",              type: "direct" },
  { from: "greenland",       to: "iceland",             type: "direct" },
  { from: "iceland",         to: "great_britain",       type: "direct" },
  { from: "iceland",         to: "scandinavia",         type: "direct" },
  { from: "great_britain",   to: "scandinavia",         type: "direct" },
  { from: "great_britain",   to: "northern_europe",     type: "direct" },
  { from: "great_britain",   to: "western_europe",      type: "direct" },
  { from: "western_europe",  to: "north_africa",        type: "direct" },
  { from: "southern_europe", to: "north_africa",        type: "direct" },
  { from: "southern_europe", to: "egypt",               type: "direct" },
  { from: "east_africa",     to: "middle_east",         type: "direct" },
  { from: "east_africa",     to: "madagascar",          type: "direct" },
  { from: "south_africa",    to: "madagascar",          type: "direct" },
  { from: "brazil",          to: "north_africa",        type: "direct" },
  { from: "japan",           to: "kamchatka",           type: "direct" },
  { from: "japan",           to: "mongolia",            type: "direct" },
  { from: "southeast_asia",  to: "indonesia",           type: "direct" },
  { from: "indonesia",       to: "new_guinea",          type: "direct" },
  { from: "indonesia",       to: "western_australia",   type: "direct" },
  { from: "new_guinea",      to: "western_australia",   type: "direct" },
  { from: "new_guinea",      to: "eastern_australia",   type: "direct" },
];
```

### Player Colors
```javascript
const PLAYER_COLORS = [
  "#3b82f6",  // blue
  "#ef4444",  // red
  "#22c55e",  // green
  "#f59e0b",  // amber
  "#a855f7",  // purple
  "#ec4899",  // pink
];
```

### Card Types
- `INFANTRY` (green)
- `CAVALRY` (blue)
- `ARTILLERY` (red)
- `WILD`

Card trade rules: 3 of same type OR 1 of each OR any set including a WILD. Must trade at 5+ cards.

---

## Bot Personalities

| ID | Name | Style |
|---|---|---|
| `bot:greedy` | Greedy | Maximize territory expansion |
| `bot:random` | Random | Random valid moves |
| `bot:turtle` | Turtlenator | Defensive, forms defensive pacts |
| `bot:havoc` | General Havoc | Aggressive, issues threats |
| `bot:diplomat` | Diplomat | Strategic alliance building |

All bots have difficulty: `easy` / `medium` / `hard` / `extreme`

---

## LLM Provider System [EXTENDED]

This is the major expansion over the original RaiSK. Instead of hardcoding 3 providers, the system supports:

### 1. Built-in Cloud Providers
Pre-configured, user just needs an API key:

| Provider ID | Name | Base URL | Notes |
|---|---|---|---|
| `anthropic` | Anthropic | `https://api.anthropic.com/v1` | Claude models |
| `openai` | OpenAI | `https://api.openai.com/v1` | GPT-4 etc. |
| `xai` | xAI | `https://api.x.ai/v1` | Grok models |
| `google` | Google AI | `https://generativelanguage.googleapis.com/v1beta` | Gemini models |
| `mistral` | Mistral AI | `https://api.mistral.ai/v1` | Mistral models |
| `cohere` | Cohere | `https://api.cohere.ai/v1` | Command models |
| `groq` | Groq | `https://api.groq.com/openai/v1` | Fast inference (OpenAI-compatible) |
| `together` | Together AI | `https://api.together.xyz/v1` | Open model hosting |
| `deepseek` | DeepSeek | `https://api.deepseek.com/v1` | DeepSeek models |
| `openrouter` | OpenRouter | `https://openrouter.ai/api/v1` | Meta-provider, 100+ models |

### 2. Custom Providers [NEW]
Users can save their own provider configs in their profile. Supports any OpenAI-compatible API:

```typescript
interface CustomProvider {
  id: string;                   // UUID
  name: string;                 // user-defined label e.g. "My Company LLM"
  base_url: string;             // e.g. "https://my-llm.company.com/v1"
  api_key?: string;             // optional, stored encrypted
  api_key_header?: string;      // default: "Authorization: Bearer ..."
  default_model?: string;       // e.g. "my-model-v2"
  extra_headers?: Record<string, string>;  // any additional headers
  protocol: "openai" | "anthropic" | "ollama";  // wire format
}
```

Stored via:
```
GET    /users/me/custom-providers
POST   /users/me/custom-providers
PUT    /users/me/custom-providers/:id
DELETE /users/me/custom-providers/:id
```

### 3. Local Models (Ollama) [NEW]
Run models locally via Ollama. No API key needed. User sets the base URL (default: `http://localhost:11434`).

```typescript
interface LocalProviderConfig {
  type: "local";
  runtime: "ollama";
  base_url: string;             // e.g. "http://localhost:11434"
  model: string;                // e.g. "llama3", "mistral", "deepseek-r1:7b"
}
```

When `provider_type: "local"`, the backend proxies the request to the user-specified URL, OR the frontend calls it directly (configurable — direct mode for self-hosted setups).

### Protocol Adapters
All providers are normalized to a common internal interface before sending to the game engine:

```typescript
interface LLMRequest {
  system_prompt: string;        // game state + rules context
  user_prompt: string;          // current board state + valid moves
  model: string;
  max_tokens: number;
  temperature: number;
}

interface LLMResponse {
  action: ActionPayload;        // parsed game action
  reasoning?: string;           // chain of thought if available
  raw_text: string;             // full model output
}
```

Supported wire formats:
- **OpenAI format**: used by openai, xai, groq, together, deepseek, openrouter, ollama (openai-compat), custom
- **Anthropic format**: used by anthropic
- **Ollama native format**: used by ollama native endpoint

### Agent Config (Extended)

```typescript
interface AgentConfig {
  type: "llm";

  // Option A: built-in provider
  provider?: "anthropic" | "openai" | "xai" | "google" | "mistral" |
             "cohere" | "groq" | "together" | "deepseek" | "openrouter";

  // Option B: saved custom provider
  custom_provider_id?: string;

  // Option C: local model
  local_base_url?: string;      // e.g. "http://localhost:11434"
  local_runtime?: "ollama";

  // Option D: one-off custom (not saved)
  adhoc_base_url?: string;
  adhoc_api_key?: string;
  adhoc_protocol?: "openai" | "anthropic" | "ollama";

  model: string;
  strategy?: "aggressive" | "balanced" | "conservative";
  directives?: string;
}
```

### UI: Provider Selection Flow
In the lobby slot config, when a slot is set to `llm`:
1. **Provider Type** dropdown: Built-in / Custom (saved) / Local (Ollama) / One-off
2. **If Built-in**: provider dropdown → model dropdown (fetched from `/config/models/:provider`)
3. **If Custom (saved)**: dropdown of user's saved providers → model input
4. **If Local**: base URL input (default `http://localhost:11434`) → model input with Ollama model list fetch
5. **If One-off**: base URL + API key + protocol + model inputs
6. **Strategy** + **Directives** always shown for LLM slots

---

## Nuclear Weapons

- Configurable 0–42 warheads per player at game start
- `POST .../action { type: "nuke", to_id }` to deploy
- Effects:
  - Target territory: irradiated wasteland, impassable for 3 cycles
  - Adjacent territories: -50% armies (min 1 survivor)
  - Deployer: UN sanctions, -50% reinforcements for 3 turns
  - Global morale penalty
- Cross-wasteland attacks: can attack through irradiated zones, costs 1/3 troops
- AI agents reason about nuclear strategy autonomously

---

## Diplomacy System

- Players send messages alongside actions: `{ ...action, message: "text" }`
- Alliance proposals tracked with outcomes: proposed / accepted / rejected / broken
- `end_reason`: `game_ended` / `ally_eliminated` / `betrayed` / `mutual_break` / `minor_skirmish`
- Truthfulness score tracked per player
- Stats: alliances proposed, accepted, rejected, broken, betrayals committed/suffered, avg duration

---

## Rating System

- Elo-based, updates after every completed game
- Tiers: Bronze → Silver → Gold → Platinum → Diamond
- Tracked separately for: human players, bots, LLM models
- Custom provider / local models also tracked on leaderboard under their model name

---

## Real-time Architecture

```
Frontend                          Backend
   |                                  |
   |-- GET /api/games/:id/stream ---> |
   |   (SSE connection)               |
   |                                  |
   |<-- event: game-state (JSON) ---- | (every move)
   |<-- event: game-end   (JSON) ---- | (game over)
   |                                  |
   |-- POST /api/games/:id/           |
   |   players/:id/action  ---------> | (human move)
   |<-- 200 OK --------------------- |
   |                                  |
   |         Backend calls LLM:       |
   |                              [Anthropic API]
   |                              [OpenAI API]
   |                              [Custom URL]
   |                              [localhost:11434] ← Ollama
```

Reconnection: exponential backoff with max retries.

---

## Planned New Features

### Local AI Models (Ollama)
- Users can point an agent slot to their local Ollama instance
- Backend proxies the request OR frontend calls directly (self-hosted mode)
- Model list auto-fetched from Ollama's `/api/tags` endpoint
- Tested with: llama3, mistral, deepseek-r1, phi3, gemma2, qwen2.5, etc.
- No API key required

### Custom AI Providers
- Any OpenAI-compatible endpoint works: LM Studio, vLLM, llama.cpp server, AWS Bedrock (via proxy), Azure OpenAI, etc.
- Users save named provider configs in their profile
- Custom providers appear alongside built-in ones in the lobby slot UI
- API keys stored encrypted on the server

### Extended Built-in Provider Support
Added over RaiSK's original 3 (Anthropic, OpenAI, xAI):
- Google (Gemini)
- Mistral AI
- Cohere
- Groq (fast inference)
- Together AI
- DeepSeek
- OpenRouter (access 100+ models with one key)

### Provider Validation
- On save, the backend sends a minimal test request to verify the provider/key works
- Shows latency and model response sample in the UI
- `POST /users/me/custom-providers/validate` — test before saving

### Model Discovery
- For Ollama: auto-fetch model list from `/api/tags`
- For OpenRouter: fetch model list from their `/models` API
- For built-in providers: curated list from `/config/models/:provider`
- For custom/one-off: manual model name input with autocomplete suggestions

### Self-hosted / Offline Mode
- Frontend can be configured to call local models directly (bypassing backend)
- Useful for fully local setups with no internet
- Toggle in settings: "Direct LLM calls" (frontend → model, no backend proxy)

---

## Changelog (RaiSK Original)

| Date | Feature |
|---|---|
| March 2026 | SEO improvements, battle names, account privacy |
| March 2026 | Email verification + password reset |
| March 2026 | Stability fixes, player badges, keyboard navigation |
| March 2026 | Nuclear weapons system |
| March 2026 | Diplomacy analytics (alliance tracking, betrayal scoring) |
| March 2026 | Player chat with AI agents |
| March 2026 | Leaderboard & Elo rating system |
| February 2026 | Bot personalities (Turtlenator, General Havoc, Diplomat), 4 difficulty levels |
| January 2026 | Earlier features |
| December 2025 | Initial launch |
