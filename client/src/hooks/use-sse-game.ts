import { useEffect, useRef, useCallback, useState } from "react";
import { GameStateDTO } from "@raisk/shared";

interface UseSSEGameOptions {
  gameId: string;
  onState?: (state: GameStateDTO) => void;
  onEnd?: (state: GameStateDTO) => void;
  onError?: (error: Event) => void;
  autoConnect?: boolean;
}

export function useSSEGame({
  gameId,
  onState,
  onEnd,
  onError,
  autoConnect = true,
}: UseSSEGameOptions) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 10;
  const BASE_DELAY = 1000;

  const connect = useCallback(() => {
    if (!gameId || !autoConnect) return;

    const token = localStorage.getItem("token");
    const url = `/api/games/${gameId}/stream${token ? `?token=${token}` : ""}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("game-state", (e) => {
      retryCountRef.current = 0;
      setConnected(true);
      try {
        const state: GameStateDTO = JSON.parse(e.data);
        onState?.(state);
      } catch {}
    });

    es.addEventListener("game-end", (e) => {
      setConnected(false);
      try {
        const state: GameStateDTO = JSON.parse(e.data);
        onEnd?.(state);
      } catch {}
      es.close();
    });

    es.onerror = (err) => {
      setConnected(false);
      es.close();
      onError?.(err);

      // Reconnect with exponential backoff
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY * Math.pow(2, retryCountRef.current), 30000);
        retryCountRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };
  }, [gameId, onState, onEnd, onError, autoConnect]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, [connect]);

  return { connected };
}
