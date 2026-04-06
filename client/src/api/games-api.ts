import { api } from "./client";

export const gamesApi = {
  list: () => api.get("/games"),
  get: (id: string) => api.get(`/games/${id}`),
  create: (config: { agents: any[]; seed?: number; move_delay_ms?: number; nukes_per_player?: number; max_turns?: number }) =>
    api.post("/games", config),
  cancel: (id: string) => api.delete(`/games/${id}`),
  snapshots: (id: string) => api.get(`/games/${id}/snapshots`),
  action: (gameId: string, playerId: string, action: any) =>
    api.post(`/games/${gameId}/players/${playerId}/action`, action),
};
