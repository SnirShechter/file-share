import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface WebSocketEvent {
  event: string;
  data: {
    fileId: string;
    filename: string;
    downloadedAt: string;
    newDownloadCount: number;
  };
}

export function useWebSocket(
  ownerKey: string | null,
  token: string | null,
  sessionId: string | null
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();
  const reconnectDelay = useRef(1000);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (!ownerKey) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    const params = new URLSearchParams();
    if (token) {
      params.set('token', token);
    } else if (sessionId) {
      params.set('sessionId', sessionId);
    }

    const url = `${protocol}//${host}/api/ws?${params.toString()}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectDelay.current = 1000; // Reset backoff on success
    };

    ws.onmessage = (event) => {
      try {
        const msg: WebSocketEvent = JSON.parse(event.data);

        if (msg.event === 'file:downloaded') {
          toast(`${msg.data.filename} הורד! (${msg.data.newDownloadCount} הורדות)`, {
            icon: '📥',
          });
          // Invalidate file list to refresh download counts
          queryClient.invalidateQueries({ queryKey: ['files'] });
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      // Reconnect with exponential backoff
      reconnectTimeout.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [ownerKey, token, sessionId, queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);
}
