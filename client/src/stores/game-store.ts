import { create } from "zustand";
import { GameStateDTO, ActionDTO } from "@raisk/shared";

interface GameStore {
  game: GameStateDTO | null;
  gameLog: ActionDTO[];
  loading: boolean;
  error: string | null;
  setGame: (game: GameStateDTO) => void;
  appendLog: (action: ActionDTO) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  game: null,
  gameLog: [],
  loading: false,
  error: null,

  setGame: (game) => set({ game }),
  appendLog: (action) =>
    set((state) => ({ gameLog: [...state.gameLog, action] })),
  reset: () => set({ game: null, gameLog: [], loading: false, error: null }),
}));
