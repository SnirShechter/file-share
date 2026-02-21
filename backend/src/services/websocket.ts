import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { verifyJwt } from '../middleware/auth.js';

const connections = new Map<string, Set<WebSocket>>();

let wss: WebSocketServer;

export function createWebSocketServer() {
  wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket, ownerKey: string) => {
    addConnection(ownerKey, ws);

    ws.on('close', () => {
      removeConnection(ownerKey, ws);
    });

    ws.on('error', () => {
      removeConnection(ownerKey, ws);
    });

    // Send a welcome message
    ws.send(JSON.stringify({ event: 'connected', data: { ownerKey } }));
  });

  return wss;
}

export async function handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer) {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const sessionId = url.searchParams.get('sessionId');
  const token = url.searchParams.get('token');

  let ownerKey: string | null = null;

  // Try JWT token first
  if (token) {
    try {
      const payload = await verifyJwt(token);
      if (payload.sub) {
        ownerKey = `user:${payload.sub}`;
      }
    } catch {
      // Invalid token, try sessionId
    }
  }

  // Try Authorization header
  if (!ownerKey) {
    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = await verifyJwt(authHeader.slice(7));
        if (payload.sub) {
          ownerKey = `user:${payload.sub}`;
        }
      } catch {
        // Invalid token
      }
    }
  }

  // Fall back to sessionId
  if (!ownerKey && sessionId) {
    ownerKey = `session:${sessionId}`;
  }

  if (!ownerKey) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, ownerKey);
  });
}

function addConnection(ownerKey: string, ws: WebSocket) {
  let set = connections.get(ownerKey);
  if (!set) {
    set = new Set();
    connections.set(ownerKey, set);
  }
  set.add(ws);
}

function removeConnection(ownerKey: string, ws: WebSocket) {
  const set = connections.get(ownerKey);
  if (set) {
    set.delete(ws);
    if (set.size === 0) {
      connections.delete(ownerKey);
    }
  }
}

export function notifyOwner(ownerKey: string, event: string, data: object) {
  const sockets = connections.get(ownerKey);
  if (sockets) {
    const message = JSON.stringify({ event, data });
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }
}

export function getOwnerKey(userId: string | null, sessionId: string | null): string | null {
  if (userId) return `user:${userId}`;
  if (sessionId) return `session:${sessionId}`;
  return null;
}
