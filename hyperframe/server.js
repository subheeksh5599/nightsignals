const http = require('http');
const Buffer = require('buffer').Buffer;

const PORT = 8422;

// ─── SVG Frame Generators ────────────────────────────────────────────────────

function frameHero() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#08080c"/><stop offset="100%" stop-color="#0d0d14"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14141a"/><stop offset="100%" stop-color="#111118"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- Logo -->
  <text x="40" y="55" font-family="Inter,sans-serif" font-weight="700" font-size="26" fill="#e8e8ed">NightSignals<tspan fill="#6C5CE7">.</tspan></text>
  <!-- Badge -->
  <rect x="40" y="72" width="140" height="26" rx="6" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <text x="110" y="90" font-family="JetBrains Mono,monospace" font-size="10" fill="rgba(232,232,237,0.45)" text-anchor="middle" letter-spacing="1.5">MIDNIGHT PREPROD</text>
  <rect x="188" y="72" width="120" height="26" rx="6" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <text x="248" y="90" font-family="JetBrains Mono,monospace" font-size="10" fill="rgba(232,232,237,0.45)" text-anchor="middle" letter-spacing="1.5">COMPACT v0.23</text>
  <!-- Main headline -->
  <text x="40" y="180" font-family="Inter,sans-serif" font-weight="700" font-size="72" fill="#e8e8ed" letter-spacing="-2">the insight is proven,</text>
  <text x="40" y="260" font-family="Inter,sans-serif" font-weight="700" font-size="72" fill="#6C5CE7" letter-spacing="-2">not shown.</text>
  <!-- Description -->
  <text x="40" y="310" font-family="Inter,sans-serif" font-size="16" fill="rgba(232,232,237,0.55)" line-height="1.6">
    <tspan x="40" dy="0">Creators sell trading signals with cryptographic proof.</tspan>
    <tspan x="40" dy="24">Buyers verify on-chain. The content never touches the public ledger.</tspan>
  </text>
  <!-- Stats row -->
  <rect x="40" y="380" width="1120" height="100" rx="14" fill="url(#card)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="120" y="435" font-family="JetBrains Mono,monospace" font-weight="700" font-size="42" fill="#6C5CE7" text-anchor="middle">3</text>
  <text x="120" y="460" font-family="Inter,sans-serif" font-weight="600" font-size="12" fill="rgba(232,232,237,0.35)" text-anchor="middle" letter-spacing="1.5">ZK CIRCUITS</text>
  <line x1="240" y1="395" x2="240" y2="465" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="360" y="435" font-family="JetBrains Mono,monospace" font-weight="700" font-size="42" fill="#6C5CE7" text-anchor="middle">13</text>
  <text x="360" y="460" font-family="Inter,sans-serif" font-weight="600" font-size="12" fill="rgba(232,232,237,0.35)" text-anchor="middle" letter-spacing="1.5">TESTS PASSING</text>
  <line x1="480" y1="395" x2="480" y2="465" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="600" y="435" font-family="JetBrains Mono,monospace" font-weight="700" font-size="42" fill="#6C5CE7" text-anchor="middle">50</text>
  <text x="600" y="460" font-family="Inter,sans-serif" font-weight="600" font-size="12" fill="rgba(232,232,237,0.35)" text-anchor="middle" letter-spacing="1.5">PREPROD USERS</text>
  <line x1="720" y1="395" x2="720" y2="465" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="860" y="435" font-family="JetBrains Mono,monospace" font-weight="700" font-size="42" fill="#2ecc71" text-anchor="middle">4.3</text>
  <text x="860" y="460" font-family="Inter,sans-serif" font-weight="600" font-size="12" fill="rgba(232,232,237,0.35)" text-anchor="middle" letter-spacing="1.5">USER RATING</text>
  <!-- Contract address -->
  <rect x="40" y="510" width="1120" height="50" rx="10" fill="#0a0a10" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="60" y="540" font-family="JetBrains Mono,monospace" font-size="12" fill="rgba(232,232,237,0.35)">Contract 5c35a52355d...d80db3e</text>
  <text x="1100" y="540" font-family="JetBrains Mono,monospace" font-size="12" fill="rgba(232,232,237,0.35)" text-anchor="end">nightsignals.vercel.app</text>
  <!-- Footer bar -->
  <rect x="40" y="580" width="1120" height="2" fill="rgba(108,92,231,0.3)"/>
</svg>`;
}

function framePrivacy() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#08080c"/><stop offset="100%" stop-color="#0d0d14"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14141a"/><stop offset="100%" stop-color="#111118"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="40" y="55" font-family="Inter,sans-serif" font-weight="700" font-size="26" fill="#e8e8ed">NightSignals<tspan fill="#6C5CE7">.</tspan></text>
  <text x="40" y="100" font-family="JetBrains Mono,monospace" font-size="11" fill="#6C5CE7" letter-spacing="1.5">SELECTIVE DISCLOSURE</text>
  <text x="40" y="140" font-family="Inter,sans-serif" font-weight="700" font-size="44" fill="#e8e8ed" letter-spacing="-1">The chain verifies the trade.</text>
  <text x="40" y="190" font-family="Inter,sans-serif" font-weight="700" font-size="44" fill="rgba(232,232,237,0.6)" letter-spacing="-1">It never sees the content.</text>
  <!-- Left card - Public -->
  <rect x="40" y="230" width="550" height="360" rx="16" fill="url(#card)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="70" y="270" font-family="JetBrains Mono,monospace" font-size="11" fill="rgba(232,232,237,0.45)" letter-spacing="1.5">PUBLIC LEDGER — VISIBLE TO EVERYONE</text>
  <text x="70" y="310" font-family="JetBrains Mono,monospace" font-size="13" fill="#e8e8ed">Content Hash</text><text x="540" y="310" font-family="JetBrains Mono,monospace" font-size="13" fill="rgba(232,232,237,0.6)" text-anchor="end">0x3f8a...b12d</text>
  <line x1="70" y1="325" x2="520" y2="325" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="70" y="350" font-family="JetBrains Mono,monospace" font-size="13" fill="#e8e8ed">Price</text><text x="540" y="350" font-family="JetBrains Mono,monospace" font-size="13" fill="rgba(232,232,237,0.6)" text-anchor="end">50 tNIGHT</text>
  <line x1="70" y1="365" x2="520" y2="365" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="70" y="390" font-family="JetBrains Mono,monospace" font-size="13" fill="#e8e8ed">Buyer Count</text><text x="540" y="390" font-family="JetBrains Mono,monospace" font-size="13" fill="rgba(232,232,237,0.6)" text-anchor="end">3 purchases</text>
  <line x1="70" y1="405" x2="520" y2="405" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="70" y="430" font-family="JetBrains Mono,monospace" font-size="13" fill="#e8e8ed">Creator Identity</text><text x="540" y="430" font-family="JetBrains Mono,monospace" font-size="13" fill="rgba(232,232,237,0.6)" text-anchor="end">ZK commitment</text>
  <line x1="70" y1="445" x2="520" y2="445" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="70" y="470" font-family="JetBrains Mono,monospace" font-size="13" fill="#e8e8ed">Active Status</text><text x="540" y="470" font-family="JetBrains Mono,monospace" font-size="13" fill="#2ecc71" text-anchor="end">true</text>
  <!-- Right card - Private -->
  <rect x="610" y="230" width="550" height="360" rx="16" fill="url(#card)" stroke="#6C5CE7" stroke-width="1"/>
  <text x="640" y="270" font-family="JetBrains Mono,monospace" font-size="11" fill="#6C5CE7" letter-spacing="1.5">PRIVATE WITNESS — NEVER TOUCHES THE CHAIN</text>
  <text x="640" y="310" font-family="JetBrains Mono,monospace" font-size="13" fill="#e8e8ed">Signal Content</text><text x="1110" y="310" font-family="JetBrains Mono,monospace" font-size="13" fill="#6C5CE7" text-anchor="end">Encrypted</text>
  <line x1="640" y1="325" x2="1090" y2="325" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="640" y="350" font-family="JetBrains Mono,monospace" font-size="13" fill="#e8e8ed">Creator Wallet</text><text x="1110" y="350" font-family="JetBrains Mono,monospace" font-size="13" fill="#6C5CE7" text-anchor="end">Untraceable</text>
  <line x1="640" y1="365" x2="1090" y2="365" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="640" y="390" font-family="JetBrains Mono,monospace" font-size="13" fill="#e8e8ed">Buyer Identity</text><text x="1110" y="390" font-family="JetBrains Mono,monospace" font-size="13" fill="#6C5CE7" text-anchor="end">Shielded</text>
  <line x1="640" y1="405" x2="1090" y2="405" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="640" y="430" font-family="JetBrains Mono,monospace" font-size="13" fill="#e8e8ed">Decryption Key</text><text x="1110" y="430" font-family="JetBrains Mono,monospace" font-size="13" fill="#6C5CE7" text-anchor="end">Local witness</text>
  <line x1="640" y1="445" x2="1090" y2="445" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="640" y="470" font-family="JetBrains Mono,monospace" font-size="13" fill="#e8e8ed">Purchase Link</text><text x="1110" y="470" font-family="JetBrains Mono,monospace" font-size="13" fill="#6C5CE7" text-anchor="end">Not recorded</text>
  <!-- Divider -->
  <rect x="40" y="610" width="1120" height="2" fill="rgba(108,92,231,0.3)"/>
</svg>`;
}

function frameHow() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#08080c"/><stop offset="100%" stop-color="#0d0d14"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14141a"/><stop offset="100%" stop-color="#111118"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="40" y="55" font-family="Inter,sans-serif" font-weight="700" font-size="26" fill="#e8e8ed">NightSignals<tspan fill="#6C5CE7">.</tspan></text>
  <text x="40" y="100" font-family="JetBrains Mono,monospace" font-size="11" fill="#6C5CE7" letter-spacing="1.5">FOUR STEPS — ZK CIRCUIT CALLS</text>
  <text x="40" y="145" font-family="Inter,sans-serif" font-weight="700" font-size="44" fill="#e8e8ed" letter-spacing="-1">Every action is a ZK circuit call</text>
  <!-- 4 Cards -->
  <rect x="40" y="190" width="265" height="410" rx="14" fill="url(#card)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="60" y="230" font-family="JetBrains Mono,monospace" font-weight="700" font-size="32" fill="#6C5CE7">01</text>
  <text x="60" y="265" font-family="Inter,sans-serif" font-weight="700" font-size="18" fill="#e8e8ed">Create Signal</text>
  <text x="60" y="295" font-family="Inter,sans-serif" font-size="12" fill="rgba(232,232,237,0.5)" line-height="1.6">
    <tspan x="60" dy="0">Creator hashes the insight</tspan>
    <tspan x="60" dy="18">inside a ZK circuit. Hash</tspan>
    <tspan x="60" dy="18">is disclosed to the ledger.</tspan>
    <tspan x="60" dy="18">Content stays in private</tspan>
    <tspan x="60" dy="18">witness — never on-chain.</tspan>
  </text>
  <rect x="320" y="190" width="265" height="410" rx="14" fill="url(#card)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="340" y="230" font-family="JetBrains Mono,monospace" font-weight="700" font-size="32" fill="#6C5CE7">02</text>
  <text x="340" y="265" font-family="Inter,sans-serif" font-weight="700" font-size="18" fill="#e8e8ed">Purchase Access</text>
  <text x="340" y="295" font-family="Inter,sans-serif" font-size="12" fill="rgba(232,232,237,0.5)" line-height="1.6">
    <tspan x="340" dy="0">Buyer pays tNIGHT via</tspan>
    <tspan x="340" dy="18">receiveUnshielded. Tx is</tspan>
    <tspan x="340" dy="18">publicly visible but buyer</tspan>
    <tspan x="340" dy="18">identity is shielded — not</tspan>
    <tspan x="340" dy="18">stored anywhere on-chain.</tspan>
  </text>
  <rect x="600" y="190" width="265" height="410" rx="14" fill="url(#card)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="620" y="230" font-family="JetBrains Mono,monospace" font-weight="700" font-size="32" fill="#6C5CE7">03</text>
  <text x="620" y="265" font-family="Inter,sans-serif" font-weight="700" font-size="18" fill="#e8e8ed">Off-chain Delivery</text>
  <text x="620" y="295" font-family="Inter,sans-serif" font-size="12" fill="rgba(232,232,237,0.5)" line-height="1.6">
    <tspan x="620" dy="0">Creator sends content to</tspan>
    <tspan x="620" dy="18">buyer through any channel.</tspan>
    <tspan x="620" dy="18">Discord, email, encrypted</tspan>
    <tspan x="620" dy="18">DM. The chain holds the</tspan>
    <tspan x="620" dy="18">proof, not the payload.</tspan>
  </text>
  <rect x="880" y="190" width="280" height="410" rx="14" fill="url(#card)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="900" y="230" font-family="JetBrains Mono,monospace" font-weight="700" font-size="32" fill="#2ecc71">04</text>
  <text x="900" y="265" font-family="Inter,sans-serif" font-weight="700" font-size="18" fill="#e8e8ed">Verify Authenticity</text>
  <text x="900" y="295" font-family="Inter,sans-serif" font-size="12" fill="rgba(232,232,237,0.5)" line-height="1.6">
    <tspan x="900" dy="0">Buyer hashes received</tspan>
    <tspan x="900" dy="18">content. Match proves</tspan>
    <tspan x="900" dy="18">the signal is authentic.</tspan>
    <tspan x="900" dy="18">A mismatch is crypto-</tspan>
    <tspan x="900" dy="18">graphic proof of fraud.</tspan>
  </text>
  <rect x="40" y="610" width="1120" height="2" fill="rgba(108,92,231,0.3)"/>
</svg>`;
}

function frameContract() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#08080c"/><stop offset="100%" stop-color="#0d0d14"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14141a"/><stop offset="100%" stop-color="#111118"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="40" y="55" font-family="Inter,sans-serif" font-weight="700" font-size="26" fill="#e8e8ed">NightSignals<tspan fill="#6C5CE7">.</tspan></text>
  <text x="40" y="100" font-family="JetBrains Mono,monospace" font-size="11" fill="#6C5CE7" letter-spacing="1.5">COMPACT v0.23 · 3 CIRCUITS · 13/13 TESTS</text>
  <text x="40" y="145" font-family="Inter,sans-serif" font-weight="700" font-size="44" fill="#e8e8ed" letter-spacing="-1">On-chain, verifiable, open source</text>
  <!-- Code block -->
  <rect x="40" y="180" width="720" height="410" rx="14" fill="url(#card)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <rect x="40" y="180" width="720" height="32" rx="14" fill="#0d0d14"/>
  <rect x="40" y="198" width="720" height="14" fill="#0d0d14"/>
  <circle cx="58" cy="196" r="4" fill="#ff5f56"/>
  <circle cx="72" cy="196" r="4" fill="#ffbd2e"/>
  <circle cx="86" cy="196" r="4" fill="#2ecc71"/>
  <text x="100" y="201" font-family="JetBrains Mono,monospace" font-size="11" fill="rgba(232,232,237,0.35)">nightsignals.compact</text>
  <text x="60" y="235" font-family="JetBrains Mono,monospace" font-size="12" fill="rgba(232,232,237,0.6)">
    <tspan x="60" dy="0">export circuit createSignal(</tspan>
    <tspan x="60" dy="20">  price: Uint&lt;64&gt;,</tspan>
    <tspan x="60" dy="20">  content: Bytes&lt;32&gt;</tspan>
    <tspan x="60" dy="20">): [] {</tspan>
    <tspan x="60" dy="20">  const sk = localSecretKey();</tspan>
    <tspan x="60" dy="20">  const creator = ownerCommitment(sk);</tspan>
    <tspan x="60" dy="20">  const hash = persistentHash(</tspan>
    <tspan x="60" dy="20">    [pad(32, "ns:content:"), content]</tspan>
    <tspan x="60" dy="20">  );</tspan>
    <tspan x="60" dy="20">  signals.insert(nextId.read(),</tspan>
    <tspan x="60" dy="20">    SignalInfo {</tspan>
    <tspan x="60" dy="20">      creator: disclose(creator),</tspan>
    <tspan x="60" dy="20">      price: disclose(price),</tspan>
    <tspan x="60" dy="20">      contentHash: disclose(hash),</tspan>
    <tspan x="60" dy="20">      active: disclose(true),</tspan>
    <tspan x="60" dy="20">      buyerCount: disclose(0),</tspan>
    <tspan x="60" dy="20">  }); }</tspan>
  </text>
  <!-- Meta -->
  <rect x="780" y="180" width="380" height="410" rx="14" fill="url(#card)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="810" y="220" font-family="JetBrains Mono,monospace" font-size="10" fill="rgba(232,232,237,0.35)" letter-spacing="1.5">NETWORK</text>
  <text x="810" y="245" font-family="Inter,sans-serif" font-weight="600" font-size="15" fill="#e8e8ed">Midnight Preprod</text>
  <rect x="810" y="275" width="320" height="1" fill="rgba(255,255,255,0.06)"/>
  <text x="810" y="300" font-family="JetBrains Mono,monospace" font-size="10" fill="rgba(232,232,237,0.35)" letter-spacing="1.5">LANGUAGE</text>
  <text x="810" y="325" font-family="Inter,sans-serif" font-weight="600" font-size="15" fill="#e8e8ed">Compact v0.23</text>
  <rect x="810" y="355" width="320" height="1" fill="rgba(255,255,255,0.06)"/>
  <text x="810" y="380" font-family="JetBrains Mono,monospace" font-size="10" fill="rgba(232,232,237,0.35)" letter-spacing="1.5">CIRCUITS</text>
  <text x="810" y="405" font-family="Inter,sans-serif" font-weight="600" font-size="15" fill="#e8e8ed">3 (create, purchase, deactivate)</text>
  <rect x="810" y="435" width="320" height="1" fill="rgba(255,255,255,0.06)"/>
  <text x="810" y="460" font-family="JetBrains Mono,monospace" font-size="10" fill="rgba(232,232,237,0.35)" letter-spacing="1.5">TESTS</text>
  <text x="810" y="485" font-family="Inter,sans-serif" font-weight="600" font-size="15" fill="#2ecc71">13/13 passing</text>
  <rect x="810" y="515" width="320" height="1" fill="rgba(255,255,255,0.06)"/>
  <text x="810" y="540" font-family="JetBrains Mono,monospace" font-size="10" fill="rgba(232,232,237,0.35)" letter-spacing="1.5">LICENSE</text>
  <text x="810" y="565" font-family="Inter,sans-serif" font-weight="600" font-size="15" fill="#e8e8ed">MIT</text>
  <rect x="40" y="610" width="1120" height="2" fill="rgba(108,92,231,0.3)"/>
</svg>`;
}

function frameStats() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#08080c"/><stop offset="100%" stop-color="#0d0d14"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14141a"/><stop offset="100%" stop-color="#111118"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="40" y="55" font-family="Inter,sans-serif" font-weight="700" font-size="26" fill="#e8e8ed">NightSignals<tspan fill="#6C5CE7">.</tspan></text>
  <text x="40" y="100" font-family="JetBrains Mono,monospace" font-size="11" fill="#6C5CE7" letter-spacing="1.5">TRUST LAYER</text>
  <text x="40" y="145" font-family="Inter,sans-serif" font-weight="700" font-size="44" fill="#e8e8ed" letter-spacing="-1">Verified by the chain, validated by users</text>
  <!-- Stat cards -->
  <rect x="40" y="200" width="265" height="230" rx="14" fill="url(#card)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="172" y="270" font-family="JetBrains Mono,monospace" font-weight="700" font-size="56" fill="#6C5CE7" text-anchor="middle">13</text>
  <text x="172" y="300" font-family="Inter,sans-serif" font-weight="600" font-size="14" fill="#e8e8ed" text-anchor="middle" letter-spacing="0.5">TESTS PASSING</text>
  <text x="172" y="325" font-family="Inter,sans-serif" font-size="11" fill="rgba(232,232,237,0.45)" text-anchor="middle">Contract verification, circuit</text>
  <text x="172" y="345" font-family="Inter,sans-serif" font-size="11" fill="rgba(232,232,237,0.45)" text-anchor="middle">integrity, key validation</text>
  <rect x="320" y="200" width="265" height="230" rx="14" fill="url(#card)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="452" y="270" font-family="JetBrains Mono,monospace" font-weight="700" font-size="56" fill="#6C5CE7" text-anchor="middle">50</text>
  <text x="452" y="300" font-family="Inter,sans-serif" font-weight="600" font-size="14" fill="#e8e8ed" text-anchor="middle" letter-spacing="0.5">PREPROD USERS</text>
  <text x="452" y="325" font-family="Inter,sans-serif" font-size="11" fill="rgba(232,232,237,0.45)" text-anchor="middle">Verifiable wallet addresses</text>
  <text x="452" y="345" font-family="Inter,sans-serif" font-size="11" fill="rgba(232,232,237,0.45)" text-anchor="middle">with on-chain activity</text>
  <rect x="600" y="200" width="265" height="230" rx="14" fill="url(#card)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="732" y="270" font-family="JetBrains Mono,monospace" font-weight="700" font-size="56" fill="#6C5CE7" text-anchor="middle">3</text>
  <text x="732" y="300" font-family="Inter,sans-serif" font-weight="600" font-size="14" fill="#e8e8ed" text-anchor="middle" letter-spacing="0.5">ZK CIRCUITS</text>
  <text x="732" y="325" font-family="Inter,sans-serif" font-size="11" fill="rgba(232,232,237,0.45)" text-anchor="middle">createSignal, purchaseSignal,</text>
  <text x="732" y="345" font-family="Inter,sans-serif" font-size="11" fill="rgba(232,232,237,0.45)" text-anchor="middle">deactivateSignal</text>
  <rect x="880" y="200" width="280" height="230" rx="14" fill="url(#card)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="1020" y="270" font-family="JetBrains Mono,monospace" font-weight="700" font-size="56" fill="#2ecc71" text-anchor="middle">4.3</text>
  <text x="1020" y="300" font-family="Inter,sans-serif" font-weight="600" font-size="14" fill="#e8e8ed" text-anchor="middle" letter-spacing="0.5">USER RATING</text>
  <text x="1020" y="325" font-family="Inter,sans-serif" font-size="11" fill="rgba(232,232,237,0.45)" text-anchor="middle">Average satisfaction across</text>
  <text x="1020" y="345" font-family="Inter,sans-serif" font-size="11" fill="rgba(232,232,237,0.45)" text-anchor="middle">50 structured feedback responses</text>
  <!-- Quote -->
  <rect x="40" y="460" width="1120" height="130" rx="14" fill="url(#card)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <rect x="40" y="460" width="4" height="130" rx="2" fill="#6C5CE7"/>
  <text x="70" y="505" font-family="Inter,sans-serif" font-size="17" font-style="italic" fill="rgba(232,232,237,0.6)">
    "Anyone can claim a 90% win rate. There is no cryptographic proof. NightSignals changes
  </text>
  <text x="70" y="530" font-family="Inter,sans-serif" font-size="17" font-style="italic" fill="rgba(232,232,237,0.6)">
    that — immutable content hashes on-chain make reputation verifiable, not claimed."
  </text>
  <text x="70" y="570" font-family="JetBrains Mono,monospace" font-size="12" fill="rgba(232,232,237,0.35)">nightsignals.vercel.app · github.com/subheeksh5599/nightsignals · x.com/NightSignals_</text>
  <rect x="40" y="610" width="1120" height="2" fill="rgba(108,92,231,0.3)"/>
</svg>`;
}

// ─── Frame HTML wrapper ──────────────────────────────────────────────────────

function frameHtml(imageSvg, buttons, postUrl) {
  const imageUrl = `data:image/svg+xml;base64,${Buffer.from(imageSvg).toString("base64")}`;
  const buttonTags = buttons.map((label, i) => `  <meta property="fc:frame:button:${i + 1}" content="${label}"/>`).join("\n");
  return `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext"/>
  <meta property="fc:frame:image" content="${imageUrl}"/>
  <meta property="og:image" content="${imageUrl}"/>
${buttonTags}  <meta property="fc:frame:post_url" content="${postUrl}"/>
</head>
<body style="background:#08080c;color:#e8e8ed;font-family:JetBrains Mono,monospace;display:flex;align-items:center;justify-content:center;min-height:100vh">
  <div style="text-align:center">
    <img src="${imageUrl}" style="max-width:100%;border-radius:16px" alt="NightSignals"/>
    <p style="color:#444;font-size:12px;margin-top:16px">Privacy-preserving insight marketplace on Midnight</p>
  </div>
</body>
</html>`;
}

// ─── Server ───────────────────────────────────────────────────────────────────

function getBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      const params = new URLSearchParams(data);
      resolve(params);
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;
  const BASE = `http://localhost:${PORT}`;

  // Direct SVG routes for recording
  if (path === '/frame1.svg') { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); res.end(frameHero()); return; }
  if (path === '/frame2.svg') { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); res.end(framePrivacy()); return; }
  if (path === '/frame3.svg') { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); res.end(frameHow()); return; }
  if (path === '/frame4.svg') { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); res.end(frameContract()); return; }
  if (path === '/frame5.svg') { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); res.end(frameStats()); return; }

  // Frame 1: Hero
  if (path === '/' || path === '/hyperframe') {
    if (method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(frameHtml(frameHero(), ['How It Works →', 'GitHub'], `${BASE}/frame2`));
    } else {
      const body = await getBody();
      const btn = body.get('untrustedData.buttonIndex');
      if (btn === '2') {
        res.writeHead(302, { Location: 'https://github.com/subheeksh5599/nightsignals' });
      } else {
        res.writeHead(302, { Location: `${BASE}/frame2` });
      }
      res.end();
    }
    return;
  }

  // Frame 2: Privacy
  if (path === '/frame2') {
    if (method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(frameHtml(framePrivacy(), ['← Back', 'Next →', 'Website'], `${BASE}/frame3`));
    } else {
      const body = await getBody();
      const btn = body.get('untrustedData.buttonIndex');
      if (btn === '1') { res.writeHead(302, { Location: `${BASE}/` }); }
      else if (btn === '3') { res.writeHead(302, { Location: 'https://nightsignals.vercel.app' }); }
      else { res.writeHead(302, { Location: `${BASE}/frame3` }); }
      res.end();
    }
    return;
  }

  // Frame 3: How It Works
  if (path === '/frame3') {
    if (method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(frameHtml(frameHow(), ['← Back', 'Next →', 'Website'], `${BASE}/frame4`));
    } else {
      const body = await getBody();
      const btn = body.get('untrustedData.buttonIndex');
      if (btn === '1') { res.writeHead(302, { Location: `${BASE}/frame2` }); }
      else if (btn === '3') { res.writeHead(302, { Location: 'https://nightsignals.vercel.app' }); }
      else { res.writeHead(302, { Location: `${BASE}/frame4` }); }
      res.end();
    }
    return;
  }

  // Frame 4: Contract
  if (path === '/frame4') {
    if (method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(frameHtml(frameContract(), ['← Back', 'Next →', 'GitHub'], `${BASE}/frame5`));
    } else {
      const body = await getBody();
      const btn = body.get('untrustedData.buttonIndex');
      if (btn === '1') { res.writeHead(302, { Location: `${BASE}/frame3` }); }
      else if (btn === '3') { res.writeHead(302, { Location: 'https://github.com/subheeksh5599/nightsignals' }); }
      else { res.writeHead(302, { Location: `${BASE}/frame5` }); }
      res.end();
    }
    return;
  }

  // Frame 5: Stats
  if (path === '/frame5') {
    if (method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(frameHtml(frameStats(), ['← Back', 'Website', 'GitHub'], `${BASE}/`));
    } else {
      const body = await getBody();
      const btn = body.get('untrustedData.buttonIndex');
      if (btn === '1') { res.writeHead(302, { Location: `${BASE}/frame4` }); }
      else if (btn === '2') { res.writeHead(302, { Location: 'https://nightsignals.vercel.app' }); }
      else { res.writeHead(302, { Location: 'https://github.com/subheeksh5599/nightsignals' }); }
      res.end();
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Hyperframes running at http://localhost:${PORT}/hyperframe`);
});
