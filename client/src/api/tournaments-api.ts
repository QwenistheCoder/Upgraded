import { api } from "./client";

export const tournamentsApi = {
  list: () => api.get("/tournaments"),
  create: (data: any) => api.post("/tournaments", data),
  get: (id: string) => api.get(`/tournaments/${id}`),
  games: (id: string) => api.get(`/tournaments/${id}/games`),
  stats: (id: string) => api.get(`/tournaments/${id}/stats`),
};
