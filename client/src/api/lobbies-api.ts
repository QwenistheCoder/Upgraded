import { api } from "./client";

export const lobbiesApi = {
  list: () => api.get("/lobbies"),
  create: (data: any) => api.post("/lobbies/create", data),
  get: (id: string) => api.get(`/lobbies/${id}`),
  join: (id: string, slot?: number) => api.post(`/lobbies/${id}/join`, { slot }),
  joinByCode: (code: string) => api.post(`/lobbies/join/${code}`),
  ready: (id: string) => api.post(`/lobbies/${id}/ready`),
  leave: (id: string) => api.post(`/lobbies/${id}/leave`),
  start: (id: string) => api.post(`/lobbies/${id}/start`),
  kick: (lobbyId: string, slotId: string) =>
    api.delete(`/lobbies/${lobbyId}/slots/${slotId}/kick`),
};
