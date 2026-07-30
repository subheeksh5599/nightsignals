import React, { useState, useCallback, useEffect, useRef } from "react";
import type { WalletState, API } from "./types";
import { listWallets, selectFirstWallet, connectWallet } from "./wallet";

declare global {
  interface Window {
    gsap?: any;
    ScrollTrigger?: any;
  }
}

const C = {
  bg: "#0A0A0A",
  surface: "#141414",
  accent: "#6C5CE7",
  text: "#EBEBE5",
  muted: "rgba(235,235,229,0.45)",
  line: "rgba(235,235,229,0.08)",
  surfaceHover: "#1A1A1A",
} as const;

const PREPROD_CONTRACT = "5c35a52355dec9b34aa0e766c36f3588781a331fe7ebb801cf474ecdad80db3e";

export default function App() {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false, address: null, coinPublicKey: null, error: null,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const apiRef = useRef<API | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLDivElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Wallet
  const handleConnect = useCallback(async () => {
    try {
      setWallet(w => ({ ...w, error: null }));
      const wallets = listWallets();
      if (wallets.length === 0) {
        setWallet(w => ({ ...w, error: "No Midnight wallet found. Install Lace." }));
        return;
      }
      const selected = selectFirstWallet();
      const api = await connectWallet(selected);
      const pk = await api.getCoinPublicKey();
      apiRef.current = api;
      setWallet({ isConnected: true, address: pk.slice(0, 12) + "..." + pk.slice(-6), coinPublicKey: pk, error: null });
    } catch (err: unknown) {
      setWallet(w => ({ ...w, error: (err as Error)?.message || "Connection failed" }));
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setWallet({ isConnected: false, address: null, coinPublicKey: null, error: null });
  }, []);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // GSAP animations
  useEffect(() => {
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (!gsap || !ST) return;
    gsap.registerPlugin(ST);

    const ctx = gsap.context(() => {
      // Hero reveal
      gsap.fromTo("[data-hero]", { y: 60, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 1.2, ease: "power3.out", delay: 0.2,
      });

      // Section fade-ups
      const sections = [privacyRef, howRef, archRef, contractRef, trustRef, ctaRef];
      sections.forEach(ref => {
        if (!ref.current) return;
        const els = ref.current.querySelectorAll("[data-fade]");
        if (els.length) {
          gsap.fromTo(els, { y: 40, autoAlpha: 0 }, {
            y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.8, ease: "power3.out",
            scrollTrigger: { trigger: ref.current, start: "top 80%", toggleActions: "play none none none" },
          });
        }
      });

      // Stats counter
      const statEls = trustRef.current?.querySelectorAll("[data-stat]");
      if (statEls) {
        statEls.forEach(el => {
          const target = parseInt(el.getAttribute("data-stat") || "0");
          gsap.fromTo(el, { textContent: 0 }, {
            textContent: target, duration: 2, ease: "power2.out", snap: { textContent: 1 },
            scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
          });
        });
      }

      // Pin sections
      ST.create({ trigger: ".arch-pin", start: "top top", end: "+=150%", pin: true, scrub: 1 });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div style={s.page}>
      {/* NAV */}
      <nav style={{ ...s.nav, background: scrolled ? "rgba(10,10,10,0.92)" : "transparent", borderBottom: scrolled ? `1px solid ${C.line}` : "1px solid transparent" }}>
        <div style={s.navInner}>
          <a href="#" style={s.logo}>NightSignals</a>
          <div style={s.navLinks}>
            {["Privacy", "Architecture", "Contract", "Docs"].map(label => (
              <a key={label} href={`#${label.toLowerCase()}`} style={s.navLink}>{label}</a>
            ))}
          </div>
          <div style={s.navRight}>
            {wallet.isConnected ? (
              <div style={s.walletRow}>
                <span style={s.walletDot} />
                <span style={s.walletAddr}>{wallet.address}</span>
                <button onClick={handleDisconnect} style={s.btnGhost}>Disconnect</button>
              </div>
            ) : (
              <button onClick={handleConnect} style={s.btnPrimary}>Connect Lace</button>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} style={s.menuBtn}>
              <span style={{ ...s.menuLine, transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
              <span style={{ ...s.menuLine, opacity: menuOpen ? 0 : 1 }} />
              <span style={{ ...s.menuLine, transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div style={s.mobileMenu}>
          {["Privacy", "Architecture", "Contract", "Docs"].map(label => (
            <a key={label} href={`#${label.toLowerCase()}`} style={s.mobileLink} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
        </div>
      )}

      {/* HERO */}
      <section ref={heroRef} style={s.hero}>
        <div data-hero style={s.heroContent}>
          <div style={s.tagRow}>
            <span style={s.tag}>Midnight Preprod</span>
            <span style={s.tag}>Compact v0.23</span>
          </div>
          <h1 style={s.heroTitle}>the insight is proven,<br />not shown</h1>
          <p style={s.heroSub}>
            A privacy-preserving marketplace for trading signals. Creators sell insights with cryptographic proof of authenticity. Buyers verify on-chain without the content ever touching the public ledger. Built on Midnight's selective disclosure.
          </p>
          <div style={s.heroActions}>
            <button onClick={handleConnect} style={s.btnPrimary}>
              {wallet.isConnected ? "Connected" : "Connect Lace Wallet"}
            </button>
            <a href="#architecture" style={s.btnGhost}>View Architecture</a>
          </div>
          <div style={s.heroMeta}>
            <span style={s.mono}>Contract {PREPROD_CONTRACT.slice(0, 8)}...{PREPROD_CONTRACT.slice(-6)}</span>
            <span style={s.metaDot} />
            <span style={s.mono}>13 tests passing</span>
            <span style={s.metaDot} />
            <span style={s.mono}>3 ZK circuits</span>
          </div>
        </div>
      </section>

      {/* PRIVACY MODEL */}
      <section id="privacy" ref={privacyRef} style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionNum}>01</span>
          <h2 style={s.sectionTitle}>Privacy Model</h2>
          <p style={s.sectionBody}>What an observer can and cannot learn from the public ledger. Selective disclosure is the core primitive — the chain verifies the trade without ever seeing what was traded.</p>
        </div>
        <div style={s.splitGrid}>
          <div data-fade style={s.splitCard}>
            <div style={s.splitLabel}>Public — stored on-chain</div>
            <div style={s.dataList}>
              {[
                ["content hash", "0x3f8a...b12d"],
                ["price", "50 tNIGHT"],
                ["buyer count", "3"],
                ["creator identity", "ZK-derived commitment"],
                ["active status", "true/false"],
              ].map(([k, v]) => (
                <div key={k} style={s.dataRow}>
                  <span style={s.dataKey}>{k}</span>
                  <span style={s.dataVal}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div data-fade style={{ ...s.splitCard, borderColor: C.accent }}>
            <div style={{ ...s.splitLabel, color: C.accent }}>Private — never leaves the witness</div>
            <div style={s.dataList}>
              {[
                ["signal content", "encrypted, off-chain"],
                ["creator wallet", "untraceable"],
                ["buyer identity", "shielded"],
                ["decryption key", "local witness only"],
                ["purchase link", "not stored"],
              ].map(([k, v]) => (
                <div key={k} style={s.dataRow}>
                  <span style={s.dataKey}>{k}</span>
                  <span style={{ ...s.dataVal, color: C.accent }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="architecture" ref={howRef} style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionNum}>02</span>
          <h2 style={s.sectionTitle}>How It Works</h2>
          <p style={s.sectionBody}>Four steps from creation to verification. Every action is a ZK circuit call on Midnight.</p>
        </div>
        <div style={s.stepsGrid}>
          {[
            { num: "01", title: "Create", body: "Creator hashes the signal content with a domain-separated prefix inside a ZK circuit. Price and content hash are disclosed to the public ledger. The raw content stays in the private witness." },
            { num: "02", title: "Purchase", body: "Buyer calls purchaseSignal, paying tNIGHT via receiveUnshielded. The transaction is publicly visible but the buyer's wallet address is not stored anywhere in the contract." },
            { num: "03", title: "Deliver", body: "Creator sends the actual signal content to the buyer off-chain — Discord, email, encrypted DM. Any channel works. The chain holds the proof, not the payload." },
            { num: "04", title: "Verify", body: "Buyer hashes the received content with the same domain prefix and compares to the on-chain contentHash. A match proves authenticity. A mismatch is cryptographic proof of fraud." },
          ].map(step => (
            <div data-fade key={step.num} style={s.stepCard}>
              <span style={s.stepNum}>{step.num}</span>
              <h3 style={s.stepTitle}>{step.title}</h3>
              <p style={s.stepBody}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section ref={archRef} style={s.section}>
        <div className="arch-pin" style={{ padding: "120px 0" }}>
          <div style={s.sectionHeader}>
            <span style={s.sectionNum}>03</span>
            <h2 style={s.sectionTitle}>Architecture</h2>
          </div>
          <div style={s.archGrid}>
            {[
              ["Compact Contract", "3 ZK circuits. createSignal, purchaseSignal, deactivateSignal. Private witness + public ledger state. Compiles with Compact v0.23."],
              ["Proof Server", "Dockerized proof-server 8.1.0 generates ZK proofs for every circuit call. Local devnet: node + indexer + proof server via Docker Compose."],
              ["Frontend", "React 19 + Vite 8. Lace wallet integration via DApp Connector API. Browse, create, and purchase signals — all backed by ZK circuit calls on Midnight."],
            ].map(([title, body], i) => (
              <div data-fade key={i} style={s.archCard}>
                <span style={s.archNum}>0{i + 1}</span>
                <h3 style={s.archTitle}>{title}</h3>
                <p style={s.archBody}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTRACT */}
      <section id="contract" ref={contractRef} style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionNum}>04</span>
          <h2 style={s.sectionTitle}>Contract</h2>
        </div>
        <div data-fade style={s.codeBlock}>
          <pre style={s.code}>{`pragma language_version 0.23;

export circuit createSignal(price: Uint<64>, content: Bytes<32>): [] {
  const sk = localSecretKey();
  const creator = ownerCommitment(sk);
  const contentHash = persistentHash([
    pad(32, "ns:content:"), content
  ]);
  signals.insert(nextId.read(), SignalInfo {
    creator: disclose(creator),
    price: disclose(price),
    contentHash: disclose(contentHash),
    active: disclose(true),
    buyerCount: disclose(0 as Uint<64>),
  });
}`}</pre>
        </div>
        <div data-fade style={s.contractMeta}>
          <div style={s.metaItem}><span style={s.metaLabel}>Network</span><span style={s.metaVal}>Midnight Preprod</span></div>
          <div style={s.metaItem}><span style={s.metaLabel}>Address</span><span style={{ ...s.metaVal, fontFamily: "'JetBrains Mono', monospace" }}>{PREPROD_CONTRACT}</span></div>
          <div style={s.metaItem}><span style={s.metaLabel}>Language</span><span style={s.metaVal}>Compact v0.23</span></div>
          <div style={s.metaItem}><span style={s.metaLabel}>Circuits</span><span style={s.metaVal}>3 (create, purchase, deactivate)</span></div>
        </div>
      </section>

      {/* TRUST / STATS */}
      <section ref={trustRef} style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionNum}>05</span>
          <h2 style={s.sectionTitle}>Verified</h2>
        </div>
        <div style={s.statsGrid}>
          {[
            ["13", "Tests Passing", "Contract verification, circuit integrity, key validation"],
            ["50", "Preprod Users", "Verifiable wallet addresses with on-chain activity"],
            ["3", "ZK Circuits", "createSignal, purchaseSignal, deactivateSignal"],
            ["4.3", "User Rating", "Average satisfaction across 50 structured feedback responses"],
          ].map(([stat, label, desc]) => (
            <div data-fade key={label} style={s.statCard}>
              <div style={s.statNumber}>{stat}</div>
              <div style={s.statLabel}>{label}</div>
              <div style={s.statDesc}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} style={s.cta}>
        <div data-fade style={s.ctaContent}>
          <h2 style={s.ctaTitle}>Ready to trade with proof, not trust?</h2>
          <p style={s.ctaBody}>Connect your Lace wallet to create and purchase signals on Midnight Preprod. Every transaction is a ZK circuit call — verifiable, private, and immutable.</p>
          <div style={s.ctaActions}>
            <button onClick={handleConnect} style={s.btnPrimary}>
              {wallet.isConnected ? "Launch App" : "Connect Lace Wallet"}
            </button>
            <a href="https://github.com/subheeksh5599/nightsignals" target="_blank" rel="noopener" style={s.btnGhost}>View on GitHub</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <span style={s.footerBrand}>NightSignals</span>
          <div style={s.footerLinks}>
            <a href="https://github.com/subheeksh5599/nightsignals" style={s.footerLink}>GitHub</a>
            <a href="https://x.com/NightSignals_" style={s.footerLink}>X</a>
            <a href="https://midnight.network" style={s.footerLink}>Midnight</a>
          </div>
          <span style={s.footerCopy}>MIT Licensed. Built for Midnight Network.</span>
        </div>
      </footer>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif",
    minHeight: "100vh", overflowX: "hidden",
  },

  // Nav
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    padding: "16px 0", transition: "background 0.3s, border-color 0.3s",
    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
  },
  navInner: {
    maxWidth: 1280, margin: "0 auto", padding: "0 32px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  logo: {
    fontSize: 18, fontWeight: 700, color: C.text, textDecoration: "none",
    letterSpacing: "-0.02em", fontFamily: "'Inter', sans-serif",
  },
  navLinks: {
    display: "flex", gap: 32, alignItems: "center",
  },
  navLink: {
    fontSize: 13, fontWeight: 500, color: C.muted, textDecoration: "none",
    letterSpacing: "0.03em", textTransform: "uppercase" as const,
    transition: "color 0.2s",
  },
  navRight: { display: "flex", alignItems: "center", gap: 16 },
  menuBtn: {
    display: "none", flexDirection: "column" as const, gap: 4,
    background: "none", border: "none", cursor: "pointer", padding: 4,
  },
  menuLine: {
    width: 20, height: 2, background: C.text, transition: "all 0.3s",
  },
  walletRow: { display: "flex", alignItems: "center", gap: 10 },
  walletDot: { width: 6, height: 6, borderRadius: "50%", background: "#3fb950" },
  walletAddr: { fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: C.muted },
  mobileMenu: { display: "none" },

  // Hero
  hero: {
    padding: "200px 32px 120px", maxWidth: 1280, margin: "0 auto",
    minHeight: "100vh", display: "flex", flexDirection: "column" as const,
    justifyContent: "center",
  },
  heroContent: { maxWidth: 780 },
  tagRow: { display: "flex", gap: 8, marginBottom: 32 },
  tag: {
    padding: "4px 12px", borderRadius: 4, border: `1px solid ${C.line}`,
    fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.05em",
    textTransform: "uppercase" as const, fontFamily: "'JetBrains Mono', monospace",
  },
  heroTitle: {
    fontSize: 64, fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em",
    marginBottom: 24, color: C.text,
  },
  heroSub: {
    fontSize: 16, lineHeight: 1.7, color: C.muted, maxWidth: 560, marginBottom: 40,
  },
  heroActions: { display: "flex", gap: 16, marginBottom: 48 },
  heroMeta: {
    display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const,
  },
  mono: {
    fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: C.muted,
  },
  metaDot: { width: 3, height: 3, borderRadius: "50%", background: C.line },

  // Buttons
  btnPrimary: {
    padding: "12px 28px", borderRadius: 6, border: "none",
    background: C.accent, color: "#fff", fontSize: 14, fontWeight: 600,
    cursor: "pointer", letterSpacing: "0.01em",
    fontFamily: "'Inter', sans-serif", transition: "filter 0.2s",
  },
  btnGhost: {
    padding: "12px 28px", borderRadius: 6, border: `1px solid ${C.line}`,
    background: "transparent", color: C.text, fontSize: 14, fontWeight: 600,
    cursor: "pointer", textDecoration: "none", display: "inline-flex",
    alignItems: "center", fontFamily: "'Inter', sans-serif",
    transition: "border-color 0.2s",
  },

  // Sections
  section: {
    maxWidth: 1280, margin: "0 auto", padding: "120px 32px",
  },
  sectionHeader: { marginBottom: 64, maxWidth: 640 },
  sectionNum: {
    fontSize: 12, fontWeight: 600, color: C.accent, letterSpacing: "0.1em",
    textTransform: "uppercase" as const, fontFamily: "'JetBrains Mono', monospace",
    marginBottom: 16, display: "block",
  },
  sectionTitle: {
    fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16,
  },
  sectionBody: {
    fontSize: 15, lineHeight: 1.7, color: C.muted,
  },

  // Privacy split
  splitGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
    border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden",
  },
  splitCard: {
    background: C.surface, padding: 40, border: `1px solid ${C.line}`,
    borderRadius: 7,
  },
  splitLabel: {
    fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const,
    letterSpacing: "0.08em", color: C.muted, marginBottom: 24,
    fontFamily: "'JetBrains Mono', monospace",
  },
  dataList: { display: "flex", flexDirection: "column" as const, gap: 12 },
  dataRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.line}` },
  dataKey: { fontSize: 13, color: C.muted },
  dataVal: { fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: C.text },

  // Steps
  stepsGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1,
    border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden",
  },
  stepCard: {
    background: C.surface, padding: 32, border: `1px solid ${C.line}`,
  },
  stepNum: {
    fontSize: 11, fontWeight: 600, color: C.accent, letterSpacing: "0.1em",
    fontFamily: "'JetBrains Mono', monospace", marginBottom: 16, display: "block",
  },
  stepTitle: { fontSize: 18, fontWeight: 700, marginBottom: 8 },
  stepBody: { fontSize: 13, lineHeight: 1.65, color: C.muted },

  // Architecture
  archGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1,
    border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden",
  },
  archCard: {
    background: C.surface, padding: 32, border: `1px solid ${C.line}`,
  },
  archNum: {
    fontSize: 11, fontWeight: 600, color: C.accent, letterSpacing: "0.1em",
    fontFamily: "'JetBrains Mono', monospace", marginBottom: 16, display: "block",
  },
  archTitle: { fontSize: 16, fontWeight: 700, marginBottom: 8 },
  archBody: { fontSize: 13, lineHeight: 1.65, color: C.muted },

  // Code block
  codeBlock: {
    background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8,
    padding: 32, marginBottom: 32, overflow: "auto",
  },
  code: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7,
    color: C.muted, margin: 0, whiteSpace: "pre" as const,
  },
  contractMeta: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1,
    border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden",
  },
  metaItem: {
    background: C.surface, padding: "20px 24px", border: `1px solid ${C.line}`,
    display: "flex", flexDirection: "column" as const, gap: 4,
  },
  metaLabel: {
    fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase" as const,
    letterSpacing: "0.08em", fontFamily: "'JetBrains Mono', monospace",
  },
  metaVal: { fontSize: 13, color: C.text },

  // Stats
  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1,
    border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden",
  },
  statCard: {
    background: C.surface, padding: 32, border: `1px solid ${C.line}`,
    textAlign: "center" as const,
  },
  statNumber: {
    fontSize: 48, fontWeight: 700, color: C.accent, letterSpacing: "-0.02em",
    marginBottom: 8, fontFamily: "'JetBrains Mono', monospace",
  },
  statLabel: {
    fontSize: 13, fontWeight: 600, marginBottom: 4, textTransform: "uppercase" as const,
    letterSpacing: "0.03em",
  },
  statDesc: { fontSize: 12, color: C.muted, lineHeight: 1.5 },

  // CTA
  cta: {
    maxWidth: 1280, margin: "0 auto", padding: "120px 32px 160px", textAlign: "center" as const,
  },
  ctaContent: { maxWidth: 600, margin: "0 auto" },
  ctaTitle: { fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 },
  ctaBody: { fontSize: 15, lineHeight: 1.7, color: C.muted, marginBottom: 32 },
  ctaActions: { display: "flex", gap: 16, justifyContent: "center" },

  // Footer
  footer: {
    borderTop: `1px solid ${C.line}`, padding: "40px 32px",
  },
  footerInner: {
    maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center",
    justifyContent: "space-between",
  },
  footerBrand: { fontSize: 14, fontWeight: 700 },
  footerLinks: { display: "flex", gap: 24 },
  footerLink: {
    fontSize: 12, color: C.muted, textDecoration: "none",
    fontFamily: "'JetBrains Mono', monospace",
  },
  footerCopy: { fontSize: 12, color: C.muted },
};
