import { create } from "zustand";
import { api } from "@/api/client";
import { authApi } from "@/api/auth-api";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  email_verified: boolean;
  elo_default: number;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const res = await authApi.login(email, password);
      const token = res.data.token;
      localStorage.setItem("token", token);
      const me = await authApi.getMe();
      set({ user: me.data, token, loading: false });
    } catch {
      set({ loading: false });
      throw new Error("Login failed");
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ loading: true });
    try {
      await authApi.register(username, email, password);
      set({ loading: false });
    } catch {
      set({ loading: false });
      throw new Error("Registration failed");
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await authApi.getMe();
      set({ user: res.data, token });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, token: null });
    }
  },
}));
