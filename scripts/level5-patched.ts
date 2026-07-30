/**
 * Monkey-patch WebSocket to keep connection alive with pings.
 * The midnight preprod RPC closes idle connections quickly.
 * This wrapper adds auto-ping every 10s to prevent idle disconnects.
 */
import { WebSocket as WsImpl } from 'ws';

const OriginalWebSocket = globalThis.WebSocket as unknown as typeof WsImpl;

function PatchedWebSocket(this: any, url: string, protocols?: any) {
  const ws = new OriginalWebSocket(url, protocols) as any;

  // Auto-ping every 10s to keep the connection alive
  let pingInterval: ReturnType<typeof setInterval> | null = null;

  const startPing = () => {
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(() => {
      if (ws.readyState === OriginalWebSocket.OPEN) {
        ws.ping();
      }
    }, 10000);
  };

  const stopPing = () => {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  };

  ws.on('open', startPing);
  ws.on('close', stopPing);
  ws.on('error', stopPing);

  return ws;
}

PatchedWebSocket.prototype = OriginalWebSocket.prototype;
(PatchedWebSocket as any).OPEN = OriginalWebSocket.OPEN;
(PatchedWebSocket as any).CONNECTING = OriginalWebSocket.CONNECTING;
(PatchedWebSocket as any).CLOSING = OriginalWebSocket.CLOSING;
(PatchedWebSocket as any).CLOSED = OriginalWebSocket.CLOSED;

// Apply the patch
(globalThis as any).WebSocket = PatchedWebSocket;

// Now import and run the actual script
import('./level5-v2.ts').catch(e => { console.error(e); process.exit(1); });
