import { api } from "./client";

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (username: string, email: string, password: string) =>
    api.post("/auth/register", { username, email, password }),
  verifyEmail: (token: string) =>
    api.post("/auth/verify-email", { token }),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, password }),
  getMe: () => api.get("/users/me"),
};
