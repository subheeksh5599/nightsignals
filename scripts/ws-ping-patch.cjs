// Preload: patch ws WebSocket to auto-ping every 10s to prevent midnight RPC disconnects
const OriginalWS = require('ws');
const origInit = OriginalWS.prototype._start;

// Actually simpler: just set default options on require.cache
// But ws doesn't use global options. Let's try a different approach.
// Patch the prototype ping behavior.
const origConnect = OriginalWS.prototype.connect;

// Actually the cleanest way: force ping interval via monkeypatch
const origEmit = OriginalWS.prototype.emit;
OriginalWS.prototype.emit = function(event: string, ...args: any[]) {
  if (event === 'open') {
    const ws = this;
    const interval = setInterval(() => {
      if (ws.readyState === 1) { // OPEN
        try { ws.ping(); } catch(e) {}
      } else {
        clearInterval(interval);
      }
    }, 10000);
    ws.on('close', () => clearInterval(interval));
    ws.on('error', () => clearInterval(interval));
  }
  return origEmit.call(this, event, ...args);
};
