const http = require('http');
const PORT = 8422;

function page(title, content, prev, next) {
  const prevBtn = prev ? `<a href="${prev}" style="position:fixed;bottom:32px;left:32px;padding:12px 24px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#999;text-decoration:none;font-size:14px;font-family:JetBrains Mono,monospace;">← Back</a>` : '';
  const nextBtn = next ? `<a href="${next}" style="position:fixed;bottom:32px;right:32px;padding:12px 28px;border-radius:8px;border:none;background:#6C5CE7;color:#fff;text-decoration:none;font-size:14px;font-weight:600;font-family:Inter,sans-serif;">Next →</a>` : '';
  const ghBtn = `<a href="https://github.com/subheeksh5599/nightsignals" target="_blank" style="position:fixed;bottom:32px;right:${next ? '140px' : '32px'};padding:12px 24px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#999;text-decoration:none;font-size:14px;font-family:JetBrains Mono,monospace;">GitHub</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#08080c;color:#e8e8ed;font-family:Inter,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;-webkit-font-smoothing:antialiased;overflow:hidden}
.card{width:1100px;background:#0d0d14;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:48px 52px}
.logo{font-size:22px;font-weight:700;margin-bottom:36px}.logo s{color:#6C5CE7;text-decoration:none}
.badge{display:inline-flex;align-items:center;gap:8px;padding:5px 14px;border:1px solid rgba(255,255,255,0.08);border-radius:6px;font-size:10px;font-weight:600;color:rgba(232,232,237,0.45);text-transform:uppercase;font-family:JetBrains Mono,monospace;letter-spacing:0.08em;margin-right:8px}
.badge-row{display:flex;gap:8px;margin-bottom:28px}
h1{font-size:64px;font-weight:700;line-height:1.08;letter-spacing:-0.03em;margin-bottom:16px}
h1 .accent{color:#6C5CE7}
h2{font-size:42px;font-weight:700;line-height:1.12;letter-spacing:-0.02em;margin-bottom:12px}
p{font-size:16px;line-height:1.7;color:rgba(232,232,237,0.55);max-width:660px;margin-bottom:32px}
p.small{font-size:13px;color:rgba(232,232,237,0.4)}
.stats{display:flex;gap:0;border:1px solid rgba(255,255,255,0.06);border-radius:14px;overflow:hidden;margin-bottom:28px}
.stat{flex:1;background:#111118;padding:24px 20px;text-align:center;border-right:1px solid rgba(255,255,255,0.06)}
.stat:last-child{border-right:none}
.stat-num{font-size:40px;font-weight:700;color:#6C5CE7;font-family:JetBrains Mono,monospace;display:block}
.stat-label{font-size:11px;font-weight:600;color:rgba(232,232,237,0.35);text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;display:block}
.split{display:flex;gap:0;border:1px solid rgba(255,255,255,0.06);border-radius:14px;overflow:hidden;margin-bottom:28px}
.split-card{flex:1;background:#111118;padding:32px}
.split-card:last-child{border-left:1px solid rgba(108,92,231,0.2)}
.split-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;font-family:JetBrains Mono,monospace;margin-bottom:20px;color:rgba(232,232,237,0.4)}
.split-label.accent{color:#6C5CE7}
.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
.row:last-child{border-bottom:none}
.row-key{font-size:13px;color:rgba(232,232,237,0.55)}
.row-val{font-size:13px;font-family:JetBrains Mono,monospace;color:#e8e8ed}
.row-val.accent{color:#6C5CE7}
.grid4{display:flex;gap:0;border:1px solid rgba(255,255,255,0.06);border-radius:14px;overflow:hidden;margin-bottom:28px}
.grid4 .cell{flex:1;background:#111118;padding:28px 24px;border-right:1px solid rgba(255,255,255,0.06)}
.grid4 .cell:last-child{border-right:none}
.cell-num{font-size:13px;font-weight:700;color:#6C5CE7;font-family:JetBrains Mono,monospace;display:block;margin-bottom:14px}
.cell-title{font-size:17px;font-weight:600;margin-bottom:8px}
.cell-desc{font-size:12px;line-height:1.65;color:rgba(232,232,237,0.5)}
.code-block{background:#0a0a10;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;margin-bottom:28px}
.code-hd{display:flex;align-items:center;gap:10px;padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(232,232,237,0.35);font-family:JetBrains Mono,monospace}
.dot{width:8px;height:8px;border-radius:50%}.dot.r{background:#ff5f56}.dot.y{background:#ffbd2e}.dot.g{background:#2ecc71}
.code-body{padding:20px 24px;font-family:JetBrains Mono,monospace;font-size:11px;line-height:1.8;color:rgba(232,232,237,0.55);white-space:pre;overflow-x:auto}
.meta-row{display:flex;gap:0;border:1px solid rgba(255,255,255,0.06);border-radius:14px;overflow:hidden}
.meta-item{flex:1;background:#111118;padding:16px 20px;border-right:1px solid rgba(255,255,255,0.06)}
.meta-item:last-child{border-right:none}
.meta-label{font-size:9px;font-weight:600;color:rgba(232,232,237,0.35);text-transform:uppercase;letter-spacing:0.1em;font-family:JetBrains Mono,monospace;display:block;margin-bottom:4px}
.meta-val{font-size:13px;font-weight:500;color:#e8e8ed}
.stat-card{flex:1;background:#111118;padding:32px 20px;text-align:center;border-right:1px solid rgba(255,255,255,0.06)}
.stat-card:last-child{border-right:none}
.stats-num{font-size:48px;font-weight:700;color:#6C5CE7;font-family:JetBrains Mono,monospace;display:block;margin-bottom:8px}
.stats-label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:8px}
.stats-desc{font-size:11px;color:rgba(232,232,237,0.4);line-height:1.5}
.quote{margin-bottom:28px;border-left:3px solid #6C5CE7;padding-left:24px}
.quote p{font-size:20px;font-style:italic;line-height:1.5;color:rgba(232,232,237,0.55);margin-bottom:0}
.footer-bar{height:2px;background:rgba(108,92,231,0.3);border-radius:1px}
body{animation:fadein 0.4s ease}
@keyframes fadein{from{opacity:0}to{opacity:1}}
</style>
</head>
<body>
<div class="card">
<div class="logo">NightSignals<s>.</s></div>
${content}
<div class="footer-bar"></div>
</div>
${prevBtn}${ghBtn}${nextBtn}
</body>
</html>`;
}

// Frame 1: Hero
function frame1() {
  return page('NightSignals — Hero', `
<div class="badge-row"><span class="badge">Midnight Preprod</span><span class="badge">Compact v0.23</span></div>
<h1>the insight is proven,<br><span class="accent">not shown.</span></h1>
<p>Creators sell trading signals with cryptographic proof. Buyers verify on-chain. The content never touches the public ledger. Built on Midnight's selective disclosure — the chain confirms the trade without ever seeing what was traded.</p>
<div class="stats">
  <div class="stat"><span class="stat-num">3</span><span class="stat-label">ZK Circuits</span></div>
  <div class="stat"><span class="stat-num">13</span><span class="stat-label">Tests Passing</span></div>
  <div class="stat"><span class="stat-num">50</span><span class="stat-label">Preprod Users</span></div>
  <div class="stat"><span class="stat-num" style="color:#2ecc71">4.3</span><span class="stat-label">User Rating</span></div>
</div>
<p class="small">Contract 5c35a52355d...d80db3e · nightsignals.vercel.app</p>
`, null, '/frame2');
}

// Frame 2: Privacy
function frame2() {
  return page('NightSignals — Privacy', `
<div class="badge-row"><span class="badge" style="color:#6C5CE7;border-color:rgba(108,92,231,0.3)">Selective Disclosure</span></div>
<h2>The chain verifies the trade.<br>It never sees the content.</h2>
<p>Every signal is proven authentic without revealing the insight. This is the primitive that Midnight enables and no transparent chain can replicate.</p>
<div class="split">
  <div class="split-card">
    <div class="split-label">Public Ledger — Visible to everyone</div>
    ${[['Content Hash','0x3f8a...b12d'],['Price','50 tNIGHT'],['Buyer Count','3 purchases'],['Creator Identity','ZK commitment'],['Active Status','true']].map(([k,v]) => `<div class="row"><span class="row-key">${k}</span><span class="row-val">${v}</span></div>`).join('')}
  </div>
  <div class="split-card">
    <div class="split-label accent">Private Witness — Never touches the chain</div>
    ${[['Signal Content','Encrypted'],['Creator Wallet','Untraceable'],['Buyer Identity','Shielded'],['Decryption Key','Local witness'],['Purchase Link','Not recorded']].map(([k,v]) => `<div class="row"><span class="row-key">${k}</span><span class="row-val accent">${v}</span></div>`).join('')}
  </div>
</div>
`, '/frame1', '/frame3');
}

// Frame 3: How It Works
function frame3() {
  return page('NightSignals — How', `
<div class="badge-row"><span class="badge">Four Steps</span></div>
<h2>Every action is a<br>ZK circuit call</h2>
<div class="grid4">
  ${[{n:'01',t:'Create Signal',d:'Creator hashes the insight inside a ZK circuit. Hash disclosed to the ledger. Content stays in private witness.'},{n:'02',t:'Purchase Access',d:'Buyer pays tNIGHT. Transaction is public but buyer identity is shielded — not stored on-chain.'},{n:'03',t:'Off-chain Delivery',d:'Creator sends content through any channel — Discord, email, encrypted DM. Chain holds proof, not payload.'},{n:'04',t:'Verify Authenticity',d:'Buyer hashes received content against on-chain hash. Match proves authenticity. Mismatch is proof of fraud.'}].map(s => `<div class="cell"><span class="cell-num">${s.n}</span><div class="cell-title">${s.t}</div><p class="cell-desc">${s.d}</p></div>`).join('')}
</div>
`, '/frame2', '/frame4');
}

// Frame 4: Contract
function frame4() {
  return page('NightSignals — Contract', `
<div class="badge-row"><span class="badge">Compact v0.23</span><span class="badge">3 Circuits</span></div>
<h2>On-chain, verifiable,<br>open source.</h2>
<div class="code-block">
  <div class="code-hd"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span> nightsignals.compact</div>
  <div class="code-body">export circuit createSignal(price: Uint&lt;64&gt;, content: Bytes&lt;32&gt;): [] {
  const sk = localSecretKey();
  const creator = ownerCommitment(sk);
  const hash = persistentHash([pad(32,"ns:content:"),content]);
  signals.insert(nextId.read(), SignalInfo {
    creator: disclose(creator),
    price: disclose(price),
    contentHash: disclose(hash),
    active: disclose(true),
    buyerCount: disclose(0 as Uint&lt;64&gt;),
  });
}</div>
</div>
<div class="meta-row">
  <div class="meta-item"><span class="meta-label">Network</span><span class="meta-val">Midnight Preprod</span></div>
  <div class="meta-item"><span class="meta-label">Language</span><span class="meta-val">Compact v0.23</span></div>
  <div class="meta-item"><span class="meta-label">Circuits</span><span class="meta-val">3 circuits</span></div>
  <div class="meta-item"><span class="meta-label">Tests</span><span class="meta-val" style="color:#2ecc71">13/13 passing</span></div>
  <div class="meta-item"><span class="meta-label">License</span><span class="meta-val">MIT</span></div>
</div>
`, '/frame3', '/frame5');
}

// Frame 5: Stats + CTA
function frame5() {
  return page('NightSignals — Verified', `
<div class="badge-row"><span class="badge">Trust Layer</span></div>
<h2>Verified by the chain,<br>validated by users.</h2>
<div class="stats" style="margin-bottom:24px">
  <div class="stat-card"><span class="stats-num">13</span><span class="stats-label">Tests</span><p class="stats-desc">Contract verification, circuit integrity, key validation</p></div>
  <div class="stat-card"><span class="stats-num">50</span><span class="stats-label">Users</span><p class="stats-desc">Verifiable preprod wallet addresses with on-chain activity</p></div>
  <div class="stat-card"><span class="stats-num">3</span><span class="stats-label">Circuits</span><p class="stats-desc">createSignal, purchaseSignal, deactivateSignal</p></div>
  <div class="stat-card"><span class="stats-num" style="color:#2ecc71">4.3</span><span class="stats-label">Rating</span><p class="stats-desc">Average across 50 structured feedback responses</p></div>
</div>
<div class="quote">
  <p>"Anyone can claim a 90% win rate. There is no cryptographic proof. NightSignals changes that — immutable hashes on-chain make reputation verifiable, not claimed."</p>
</div>
<p class="small">nightsignals.vercel.app · github.com/subheeksh5599/nightsignals · x.com/NightSignals_</p>
`, '/frame4', null);
}

// Server
const server = http.createServer((req, res) => {
  const path = new URL(req.url, `http://localhost:${PORT}`).pathname;
  const routes = { '/': frame1, '/frame1': frame1, '/frame2': frame2, '/frame3': frame3, '/frame4': frame4, '/frame5': frame5 };
  const handler = routes[path];
  if (handler) { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(handler()); return; }
  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
