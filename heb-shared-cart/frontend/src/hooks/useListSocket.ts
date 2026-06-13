import { useEffect, useRef } from "react";
import { getWsUrl } from "../api/client";
import type { WsMessage } from "../types";

export function useListSocket(listId: string | null, onMessage: (msg: WsMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!listId) return;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByUs = false;

    function connect() {
      const ws = new WebSocket(getWsUrl(listId!));
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WsMessage;
          onMessageRef.current(data);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!closedByUs) {
          reconnectTimer = setTimeout(connect, 1500);
        }
      };
    }

    connect();

    return () => {
      closedByUs = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [listId]);

  const send = (msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  return { send };
}
