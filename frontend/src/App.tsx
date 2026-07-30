import React, { useState, useCallback, useEffect, useRef } from "react";
import type { SignalInfo, WalletState, API } from "./types";
import { listWallets, selectFirstWallet, connectWallet } from "./wallet";

// ─── GSAP type declarations ──────────────────────────────────────────────────

declare global {
  interface Window {
    gsap?: {
      registerPlugin: (plugin: unknown) => void;
      to: (target: unknown, vars: Record<string, unknown>) => unknown;
      fromTo: (target: unknown, fromVars: Record<string, unknown>, toVars: Record<string, unknown>) => unknown;
      set: (target: unknown, vars: Record<string, unknown>) => unknown;
      timeline: (vars?: Record<string, unknown>) => {
        to: (target: unknown, vars: Record<string, unknown>, position?: string | number) => unknown;
        fromTo: (target: unknown, fromVars: Record<string, unknown>, toVars: Record<string, unknown>, position?: string | number) => unknown;
      };
      matchMedia: () => unknown;
      context: (fn: (ctx: Record<string, unknown>) => void) => { revert: () => void };
    };
    ScrollTrigger?: {
      create: (vars: Record<string, unknown>) => unknown;
      refresh: () => void;
      getAll: () => Array<{ kill: () => void }>;
    };
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PREPROD_CONTRACT = "5c35a52355dec9b34aa0e766c36f3588781a331fe7ebb801cf474ecdad80db3e";
const PREVIEW_CONTRACT = "a234fcd8498a793f498185cc35a2e29c4145d3cc61bdd0341eefbab887bfbca3";

const MOCK_SIGNALS: SignalInfo[] = [
  { id: 1, creator: "0x7a3b...9f2c", price: 50, contentHash: "0x3f8a...b12d", active: true, buyerCount: 3 },
  { id: 2, creator: "0x1c4d...8e1a", price: 100, contentHash: "0xa2b4...c7f3", active: true, buyerCount: 7 },
];

// ─── Design tokens ───────────────────────────────────────────────────────────

const C = {
  bg: "#0A0A0A",
  surface: "#141414",
  accent: "#6C5CE7",
  text: "#EBEBE5",
  muted: "rgba(235,235,229,0.45)",
  line: "rgba(235,235,229,0.08)",
  surfaceHover: "#1A1A1A",
} as const;

const FONT = {
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  // ── Wallet state ──────────────────────────────────────────────────────────
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false, address: null, coinPublicKey: null, error: null,
  });
  const [api, setApi] = useState<API | null>(null);

  // ── Signals state ─────────────────────────────────────────────────────────
  const [signals, setSignals] = useState<SignalInfo[]>(MOCK_SIGNALS);
  const [activeTab, setActiveTab] = useState<"browse" | "create">("browse");
  const [createPrice, setCreatePrice] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<number | null>(null);

  // ── Hover states ──────────────────────────────────────────────────────────
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // ── Refs for GSAP ─────────────────────────────────────────────────────────
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);
  const circleRevealRef = useRef<HTMLDivElement>(null);
  const horizontalSectionRef = useRef<HTMLDivElement>(null);
  const horizontalInnerRef = useRef<HTMLDivElement>(null);
  const architectureRef = useRef<HTMLDivElement>(null);
  const archCard1Ref = useRef<HTMLDivElement>(null);
  const archCard2Ref = useRef<HTMLDivElement>(null);
  const archCard3Ref = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const fadeUpRefs = useRef<(HTMLDivElement | null)[]>([]);
  void fadeUpRefs;

  // ── Wallet handlers ───────────────────────────────────────────────────────

  const handleConnect = useCallback(async () => {
    try {
      setWallet((w) => ({ ...w, error: null }));
      const wallets = listWallets();
      if (wallets.length === 0) {
        setWallet((w) => ({ ...w, error: "No Midnight wallet found. Please install Lace." }));
        return;
      }
      const selected = selectFirstWallet();
      const connectedApi = await connectWallet(selected);
      const coinPk = await connectedApi.getCoinPublicKey();
      setApi(connectedApi);
      setWallet({
        isConnected: true,
        address: coinPk.slice(0, 12) + "..." + coinPk.slice(-6),
        coinPublicKey: coinPk,
        error: null,
      });
    } catch (err: unknown) {
      setWallet((w) => ({ ...w, error: (err as Error)?.message || "Failed to connect wallet" }));
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setApi(null);
    setWallet({ isConnected: false, address: null, coinPublicKey: null, error: null });
  }, []);

  // ── Signal handlers ───────────────────────────────────────────────────────

  const handleCreateSignal = useCallback(async () => {
    if (!api) return;
    const price = parseInt(createPrice);
    if (!price || price <= 0) return;
    if (!createContent.trim()) return;
    setCreateLoading(true);
    try {
      const newSignal: SignalInfo = {
        id: signals.length + 1,
        creator: wallet.coinPublicKey?.slice(0, 12) + "..." || "0x0000...0000",
        price,
        contentHash: "0x" + Math.random().toString(16).slice(2, 10) + "..." + Math.random().toString(16).slice(2, 6),
        active: true,
        buyerCount: 0,
      };
      setSignals((prev) => [...prev, newSignal]);
      setCreatePrice("");
      setCreateContent("");
      setActiveTab("browse");
    } catch (err: unknown) {
      setWallet((w) => ({ ...w, error: (err as Error)?.message || "Failed to create signal" }));
    } finally {
      setCreateLoading(false);
    }
  }, [api, createPrice, createContent, signals.length, wallet.coinPublicKey]);

  const handlePurchase = useCallback(async (signalId: number) => {
    if (!api) return;
    setPurchasing(signalId);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setSignals((prev) =>
        prev.map((s) => (s.id === signalId ? { ...s, buyerCount: s.buyerCount + 1 } : s))
      );
    } catch (err: unknown) {
      setWallet((w) => ({ ...w, error: (err as Error)?.message || "Purchase failed" }));
    } finally {
      setPurchasing(null);
    }
  }, [api]);

  // ── GSAP ScrollTrigger animations ─────────────────────────────────────────

  useEffect(() => {
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (!gsap || !ST) return;

    gsap.registerPlugin(ST);

    const ctx = gsap.context(() => {
      // ── Hero: clipPath reveal ───────────────────────────────────────────
      if (heroTextRef.current) {
        gsap.fromTo(
          heroTextRef.current,
          { clipPath: "inset(0 0 100% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: 1.4,
            ease: "power3.out",
            delay: 0.3,
          }
        );
      }

      // ── Hero subline & button fade ─────────────────────────────────────
      const heroFades = heroRef.current?.querySelectorAll("[data-hero-fade]");
      if (heroFades) {
        gsap.fromTo(
          heroFades,
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 1, stagger: 0.15, ease: "power3.out", delay: 0.8 }
        );
      }

      // ── Privacy section: circle reveal ─────────────────────────────────
      if (circleRevealRef.current) {
        gsap.fromTo(
          circleRevealRef.current,
          { clipPath: "circle(0% at 50% 50%)" },
          {
            clipPath: "circle(50% at 50% 50%)",
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: privacyRef.current,
              start: "top 70%",
              end: "bottom 30%",
              scrub: 1,
            },
          }
        );
      }

      // ── Privacy content fade ───────────────────────────────────────────
      const privacyFades = privacyRef.current?.querySelectorAll("[data-privacy-fade]");
      if (privacyFades) {
        gsap.fromTo(
          privacyFades,
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: privacyRef.current,
              start: "top 60%",
              end: "top 20%",
              scrub: false,
            },
          }
        );
      }

      // ── How it works: horizontal scroll ────────────────────────────────
      if (horizontalSectionRef.current && horizontalInnerRef.current) {
        const section = horizontalSectionRef.current;
        const inner = horizontalInnerRef.current;
        const cards = inner.children;
        const cardWidth = (cards[0] as HTMLElement)?.offsetWidth || 420;
        const gap = 24;
        const totalWidth = cards.length * cardWidth + (cards.length - 1) * gap;
        const scrollDistance = Math.max(0, totalWidth - window.innerWidth + 96);

        if (scrollDistance > 0) {
          gsap.to(inner, {
            x: -scrollDistance,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: `+=${scrollDistance + 200}`,
              scrub: 1,
              pin: true,
              anticipatePin: 1,
            },
          });
        }
      }

      // ── Architecture: pinned stacked cards ─────────────────────────────
      if (architectureRef.current) {
        ST.create({
          trigger: architectureRef.current,
          start: "top top",
          end: "+=250%",
          pin: true,
          scrub: 1,
        });

        const cards = [
          archCard1Ref.current,
          archCard2Ref.current,
          archCard3Ref.current,
        ].filter(Boolean) as HTMLDivElement[];

        cards.forEach((card, i) => {
          gsap.fromTo(
            card,
            { y: 120 * (cards.length - i), opacity: 0.3, scale: 0.92 },
            {
              y: i * 16,
              opacity: 1,
              scale: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: architectureRef.current,
                start: `${i * 25}% center`,
                end: `${(i + 1) * 25}% center`,
                scrub: 1,
              },
            }
          );
        });
      }

      // ── CTA: fade in ───────────────────────────────────────────────────
      const ctaContent = ctaRef.current?.querySelector("[data-cta-content]");
      if (ctaContent) {
        gsap.fromTo(
          ctaContent,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ctaRef.current,
              start: "top 75%",
            },
          }
        );
      }

      // ── App section fade ───────────────────────────────────────────────
      if (appRef.current) {
        gsap.fromTo(
          appRef.current,
          { autoAlpha: 0, y: 60 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: appRef.current,
              start: "top 85%",
            },
          }
        );
      }
    });

    return () => {
      ctx.revert();
      ST.getAll().forEach((t: { kill: () => void }) => t.kill());
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      {/* ══════════════════════════════════════════════════════════════════════
          NAV
          ══════════════════════════════════════════════════════════════════════ */}
      <nav style={s.nav}>
        <span style={s.brand}>NightSignals</span>
        <div style={s.navRight}>
          {wallet.isConnected ? (
            <div style={s.walletBadge}>
              <span style={s.statusDot} />
              <span style={s.walletAddress}>{wallet.address}</span>
              <button style={s.disconnectBtn} onClick={handleDisconnect}>
                Disconnect
              </button>
            </div>
          ) : (
            <button style={s.connectBtn} onClick={handleConnect}>
              Connect Lace
            </button>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} style={s.hero}>
        <div ref={heroTextRef} style={s.heroTextClip}>
          <h1 style={s.heroTitle}>the insight is proven, not shown</h1>
        </div>
        <div data-hero-fade style={s.heroSub}>
          <span style={s.heroSubText}>
            a privacy-preserving marketplace on midnight
          </span>
          <span style={s.heroDot}>—</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted }}>
            {PREPROD_CONTRACT.slice(0, 8)}...{PREPROD_CONTRACT.slice(-6)}
          </span>
        </div>
        <div data-hero-fade style={{ marginTop: 48 }}>
          {!wallet.isConnected && (
            <button style={s.heroBtn} onClick={handleConnect}>
              Connect Lace wallet
            </button>
          )}
          {wallet.isConnected && (
            <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.muted }}>
              connected: {wallet.address}
            </span>
          )}
        </div>
        <div data-hero-fade style={s.scrollHint}>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <rect x="1" y="1" width="14" height="22" rx="7" stroke={C.muted} strokeWidth="1" />
            <rect x="7" y="6" width="2" height="4" rx="1" fill={C.muted} />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PRIVACY MODEL
          ══════════════════════════════════════════════════════════════════════ */}
      <section ref={privacyRef} style={s.section}>
        <div style={s.sectionLabel}>privacy model</div>

        <div ref={circleRevealRef} style={s.circleContainer}>
          <div style={s.circleHalf}>
            <div data-privacy-fade>
              <div style={s.circleLabel}>public</div>
              <div style={s.circleTitle}>stored on-chain</div>
            </div>
            <div data-privacy-fade style={s.dataRows}>
              <div style={s.dataRow}>
                <span style={s.dataKey}>content hash</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.text }}>0x3f8a...b12d</span>
              </div>
              <div style={s.dataRow}>
                <span style={s.dataKey}>price</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.text }}>50 tNIGHT</span>
              </div>
              <div style={s.dataRow}>
                <span style={s.dataKey}>buyer count</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.text }}>3</span>
              </div>
              <div style={s.dataRow}>
                <span style={s.dataKey}>creator zk-id</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.text }}>0x7a3b...9f2c</span>
              </div>
            </div>
          </div>

          <div style={s.circleDivider} />

          <div style={s.circleHalf}>
            <div data-privacy-fade>
              <div style={s.circleLabelPrivate}>private</div>
              <div style={s.circleTitle}>never leaves your device</div>
            </div>
            <div data-privacy-fade style={s.dataRows}>
              <div style={s.dataRow}>
                <span style={s.dataKey}>signal content</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.accent }}>encrypted</span>
              </div>
              <div style={s.dataRow}>
                <span style={s.dataKey}>buyer identity</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.accent }}>shielded</span>
              </div>
              <div style={s.dataRow}>
                <span style={s.dataKey}>wallet address</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.accent }}>untraceable</span>
              </div>
              <div style={s.dataRow}>
                <span style={s.dataKey}>decryption key</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.accent }}>local witness</span>
              </div>
            </div>
          </div>
        </div>

        <p data-privacy-fade style={s.privacyFooter}>
          The chain stores proof of the signal, not the signal itself. Buyers verify content matches the hash off-chain using zero-knowledge proofs.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HOW IT WORKS (horizontal scroll)
          ══════════════════════════════════════════════════════════════════════ */}
      <section ref={horizontalSectionRef} style={s.horizontalSection}>
        <div style={s.sectionLabel} data-hw-label>how it works</div>

        <div ref={horizontalInnerRef} style={s.horizontalInner}>
          {/* Card 1 — Create */}
          <div style={s.hwCard}>
            <div style={s.hwNumber}>01</div>
            <h3 style={s.hwTitle}>Create</h3>
            <p style={s.hwBody}>
              List your insight with a price and ZK proof. Content stays encrypted — only the hash lands on-chain.
            </p>
          </div>

          {/* Card 2 — Purchase */}
          <div style={s.hwCard}>
            <div style={s.hwNumber}>02</div>
            <h3 style={s.hwTitle}>Purchase</h3>
            <p style={s.hwBody}>
              Buy access with tNIGHT. Your identity stays shielded. No KYC, no tracking, no exposure.
            </p>
          </div>

          {/* Card 3 — Verify */}
          <div style={s.hwCard}>
            <div style={s.hwNumber}>03</div>
            <h3 style={s.hwTitle}>Verify</h3>
            <p style={s.hwBody}>
              Decrypt content off-chain. Verify the hash matches. The proof is public — the insight is private.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          ARCHITECTURE (stacked cards)
          ══════════════════════════════════════════════════════════════════════ */}
      <section ref={architectureRef} style={s.archSection}>
        <div style={{ ...s.sectionLabel, color: C.text }}>architecture</div>

        <div style={s.archStack}>
          {/* Card 1 — Creator */}
          <div ref={archCard1Ref} style={{ ...s.archCard, zIndex: 1 }}>
            <div style={s.archCardHeader}>
              <span style={s.archCardLabel}>creator</span>
              <span style={s.archCardArrow}>→</span>
            </div>
            <p style={s.archCardBody}>
              Encrypts signal with ZK proof. Publishes content hash, price, and creator identity to the chain.
            </p>
            <div style={s.archCardCode}>
              <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted }}>
                prove(secret, price) &rarr; (hash, proof)
              </span>
            </div>
          </div>

          {/* Card 2 — Chain (privacy wall) */}
          <div ref={archCard2Ref} style={{ ...s.archCard, zIndex: 2, borderColor: C.accent }}>
            <div style={s.archCardHeader}>
              <span style={s.archCardLabel}>midnight chain</span>
              <span style={s.archCardArrow}>↔</span>
            </div>
            <p style={s.archCardBody}>
              Stores only public metadata: content hash, price, creator ZK-ID, and buyer count. The actual content and buyer identities are never on-chain.
            </p>
            <div style={s.privacyWall}>
              <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.accent }}>
                privacy wall — content &amp; identity shielded
              </span>
            </div>
          </div>

          {/* Card 3 — Buyer */}
          <div ref={archCard3Ref} style={{ ...s.archCard, zIndex: 3 }}>
            <div style={s.archCardHeader}>
              <span style={s.archCardLabel}>buyer</span>
              <span style={s.archCardArrow}>←</span>
            </div>
            <p style={s.archCardBody}>
              Purchases access, verifies the hash off-chain, decrypts content locally. The chain proves the signal exists without revealing it.
            </p>
            <div style={s.archCardCode}>
              <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted }}>
                verify(hash, proof) &rarr; decrypt(content)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CTA
          ══════════════════════════════════════════════════════════════════════ */}
      <section ref={ctaRef} style={s.ctaSection}>
        <div data-cta-content style={s.ctaContent}>
          <h2 style={s.ctaTitle}>deploy your first signal</h2>
          <div style={s.ctaArrow}>
            <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
              <line x1="12" y1="0" x2="12" y2="28" stroke={C.accent} strokeWidth="1.5" />
              <polyline points="4,20 12,28 20,20" stroke={C.accent} strokeWidth="1.5" fill="none" />
            </svg>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          APP SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section ref={appRef} style={s.appSection}>
        <div style={s.appContainer}>

          {/* ── Wallet bar ────────────────────────────────────────────────── */}
          <div style={s.appWalletBar}>
            <div style={s.appWalletLeft}>
              <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted }}>
                wallet
              </span>
              {wallet.isConnected ? (
                <span style={{ fontFamily: FONT.mono, fontSize: 13, color: C.text }}>
                  {wallet.address}
                </span>
              ) : (
                <span style={{ fontFamily: FONT.mono, fontSize: 13, color: C.muted }}>
                  not connected
                </span>
              )}
            </div>
            <div>
              {wallet.isConnected ? (
                <button style={s.appDisconnectBtn} onClick={handleDisconnect}>
                  disconnect
                </button>
              ) : (
                <button style={s.appConnectBtn} onClick={handleConnect}>
                  connect lace
                </button>
              )}
            </div>
          </div>

          {wallet.error && (
            <div style={s.errorBar}>{wallet.error}</div>
          )}

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div style={s.tabs}>
            <button
              style={{ ...s.tab, ...(activeTab === "browse" ? s.tabActive : {}) }}
              onClick={() => setActiveTab("browse")}
            >
              Browse Signals
              <span style={s.tabCount}>
                {signals.filter((s) => s.active).length}
              </span>
            </button>
            <button
              style={{ ...s.tab, ...(activeTab === "create" ? s.tabActive : {}) }}
              onClick={() => setActiveTab("create")}
            >
              Create Signal
            </button>
          </div>

          {/* ── Browse tab ────────────────────────────────────────────────── */}
          {activeTab === "browse" && (
            <div style={s.signalGrid}>
              {signals.filter((s) => s.active).length === 0 ? (
                <p style={s.emptyState}>No active signals. Create the first one.</p>
              ) : (
                signals
                  .filter((s) => s.active)
                  .map((signal) => (
                    <div
                      key={signal.id}
                      style={{
                        ...s.signalCard,
                        ...(hoveredCard === signal.id ? s.signalCardHover : {}),
                      }}
                      onMouseEnter={() => setHoveredCard(signal.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div style={s.cardTop}>
                        <span style={s.signalId}>#{signal.id}</span>
                        <span style={s.badge}>
                          {signal.buyerCount} purchase{signal.buyerCount !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div style={s.cardDetails}>
                        <div style={s.cardRow}>
                          <span style={s.cardLabel}>creator</span>
                          <span style={s.cardMono}>{signal.creator}</span>
                        </div>
                        <div style={s.cardRow}>
                          <span style={s.cardLabel}>content hash</span>
                          <span style={s.cardMono}>{signal.contentHash}</span>
                        </div>
                        <div style={s.cardRow}>
                          <span style={s.cardLabel}>price</span>
                          <span style={s.cardPrice}>{signal.price} tNIGHT</span>
                        </div>
                      </div>

                      <button
                        style={{
                          ...s.buyBtn,
                          ...(purchasing === signal.id || !wallet.isConnected ? s.btnDisabled : {}),
                        }}
                        disabled={purchasing === signal.id || !wallet.isConnected}
                        onClick={() => handlePurchase(signal.id)}
                      >
                        {purchasing === signal.id
                          ? "Purchasing..."
                          : wallet.isConnected
                            ? `Buy for ${signal.price} tNIGHT`
                            : "Connect wallet to buy"}
                      </button>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* ── Create tab ────────────────────────────────────────────────── */}
          {activeTab === "create" && (
            <div style={s.createForm}>
              {!wallet.isConnected ? (
                <div style={s.createLocked}>
                  <p style={s.emptyState}>Connect your Lace wallet to create signals.</p>
                  <button style={s.appConnectBtn} onClick={handleConnect}>
                    connect lace
                  </button>
                </div>
              ) : (
                <>
                  <div style={s.formGroup}>
                    <label style={s.formLabel}>Price (tNIGHT)</label>
                    <input
                      type="number"
                      min="1"
                      value={createPrice}
                      onChange={(e) => setCreatePrice(e.target.value)}
                      placeholder="50"
                      style={s.input}
                    />
                  </div>

                  <div style={s.formGroup}>
                    <label style={s.formLabel}>
                      Signal Content
                      <span style={s.formHint}>private — never stored on-chain</span>
                    </label>
                    <textarea
                      value={createContent}
                      onChange={(e) => setCreateContent(e.target.value)}
                      placeholder="Your trading insight, analysis, or strategy..."
                      rows={5}
                      style={s.textarea}
                    />
                  </div>

                  <div style={s.privacyNote}>
                    <span style={s.privacyNoteTitle}>Privacy model</span>
                    Only the content hash is stored on-chain. The signal content stays in your local private witness. Buyers verify the content matches the hash off-chain using zero-knowledge proofs.
                  </div>

                  <button
                    style={{
                      ...s.createBtn,
                      ...(createLoading || !createPrice || !createContent.trim()
                        ? s.btnDisabled
                        : {}),
                    }}
                    disabled={createLoading || !createPrice || !createContent.trim()}
                    onClick={handleCreateSignal}
                  >
                    {createLoading ? "Creating..." : "Create Signal"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════════════════════════ */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerLeft}>
            <span style={s.footerBrand}>NightSignals</span>
            <span style={s.footerMuted}>
              Built on{" "}
              <a href="https://midnight.network" target="_blank" rel="noopener" style={s.link}>
                Midnight Network
              </a>
            </span>
          </div>
          <div style={s.footerRight}>
            <a href="https://github.com/subheeksh5599/nightsignals" target="_blank" rel="noopener" style={s.link}>
              GitHub
            </a>
            <span style={s.footerMuted}>Compact v0.23</span>
          </div>
        </div>
        <div style={s.footerContracts}>
          <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.muted }}>
            preprod: {PREPROD_CONTRACT}
          </span>
          <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.muted }}>
            preview: {PREVIEW_CONTRACT}
          </span>
        </div>
      </footer>
    </div>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  // ── Page ──────────────────────────────────────────────────────────────────
  page: {
    fontFamily: FONT.body,
    background: C.bg,
    color: C.text,
    minHeight: "100vh",
    WebkitFontSmoothing: "antialiased",
  },

  // ── Nav ───────────────────────────────────────────────────────────────────
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    background: "rgba(10,10,10,0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: `1px solid ${C.line}`,
  },
  brand: {
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: C.text,
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  walletBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: C.surface,
    border: `1px solid ${C.line}`,
    padding: "6px 12px",
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#4ADE80",
    flexShrink: 0,
  },
  walletAddress: {
    fontFamily: FONT.mono,
    fontSize: 12,
    color: C.text,
  },
  disconnectBtn: {
    fontFamily: FONT.mono,
    fontSize: 11,
    color: C.muted,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: 3,
    transition: "color 0.2s",
  },
  connectBtn: {
    fontFamily: FONT.body,
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    background: C.accent,
    border: "none",
    borderRadius: 6,
    padding: "7px 16px",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    minHeight: "100vh",
    padding: "120px 32px 80px",
    maxWidth: 900,
    margin: "0 auto",
    width: "100%",
  },
  heroTextClip: {
    overflow: "hidden",
  },
  heroTitle: {
    fontSize: "clamp(42px, 7vw, 88px)",
    fontWeight: 700,
    lineHeight: 1.04,
    letterSpacing: "-0.04em",
    color: C.text,
    maxWidth: 800,
  },
  heroSub: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 32,
    flexWrap: "wrap" as const,
  },
  heroSubText: {
    fontSize: 16,
    color: C.muted,
    fontWeight: 400,
  },
  heroDot: {
    color: C.accent,
    fontWeight: 600,
  },
  heroBtn: {
    fontFamily: FONT.body,
    fontSize: 14,
    fontWeight: 600,
    color: C.text,
    background: C.accent,
    border: "none",
    borderRadius: 6,
    padding: "12px 28px",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  scrollHint: {
    position: "absolute",
    bottom: 40,
    left: "50%",
    transform: "translateX(-50%)",
    opacity: 0.5,
  },

  // ── Sections (shared) ─────────────────────────────────────────────────────
  section: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "120px 32px",
    position: "relative" as const,
  },
  sectionLabel: {
    fontFamily: FONT.mono,
    fontSize: 11,
    fontWeight: 500,
    color: C.muted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: 48,
  },

  // ── Privacy Circle ────────────────────────────────────────────────────────
  circleContainer: {
    width: "min(680px, 90vw)",
    height: "min(680px, 90vw)",
    borderRadius: "50%",
    background: C.surface,
    display: "flex",
    alignItems: "stretch",
    overflow: "hidden",
    border: `1px solid ${C.line}`,
    position: "relative" as const,
  },
  circleDivider: {
    width: 1,
    background: C.line,
    flexShrink: 0,
  },
  circleHalf: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "clamp(24px, 5vw, 48px)",
  },
  circleLabel: {
    fontFamily: FONT.mono,
    fontSize: 10,
    fontWeight: 500,
    color: C.text,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    marginBottom: 4,
  },
  circleLabelPrivate: {
    fontFamily: FONT.mono,
    fontSize: 10,
    fontWeight: 500,
    color: C.accent,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    marginBottom: 4,
  },
  circleTitle: {
    fontSize: 13,
    color: C.muted,
    fontWeight: 400,
    marginBottom: 24,
  },
  dataRows: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  dataRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  dataKey: {
    fontSize: 11,
    color: C.muted,
    fontFamily: FONT.body,
  },
  privacyFooter: {
    maxWidth: 560,
    textAlign: "center" as const,
    fontSize: 13,
    color: C.muted,
    lineHeight: 1.6,
    marginTop: 48,
  },

  // ── Horizontal Scroll ─────────────────────────────────────────────────────
  horizontalSection: {
    height: "100vh",
    overflow: "hidden",
    position: "relative" as const,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "120px 48px",
  },
  horizontalInner: {
    display: "flex",
    gap: 24,
    paddingLeft: 48,
    paddingRight: 48,
    height: "fit-content",
  },
  hwCard: {
    minWidth: 400,
    maxWidth: 440,
    flexShrink: 0,
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    padding: "40px 36px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    transition: "border-color 0.3s",
  },
  hwNumber: {
    fontFamily: FONT.mono,
    fontSize: 12,
    color: C.accent,
    letterSpacing: "0.06em",
  },
  hwTitle: {
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: "-0.03em",
    color: C.text,
  },
  hwBody: {
    fontSize: 14,
    color: C.muted,
    lineHeight: 1.6,
  },

  // ── Architecture Stacked Cards ────────────────────────────────────────────
  archSection: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "120px 32px",
    position: "relative" as const,
    background: C.bg,
  },
  archStack: {
    position: "relative" as const,
    width: "min(620px, 90vw)",
    height: 340,
  },
  archCard: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    padding: "32px 36px",
    transition: "border-color 0.3s",
  },
  archCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  archCardLabel: {
    fontFamily: FONT.mono,
    fontSize: 11,
    fontWeight: 500,
    color: C.text,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  },
  archCardArrow: {
    fontFamily: FONT.mono,
    fontSize: 16,
    color: C.muted,
  },
  archCardBody: {
    fontSize: 14,
    color: C.muted,
    lineHeight: 1.6,
    marginBottom: 16,
  },
  archCardCode: {
    background: C.bg,
    padding: "8px 12px",
    borderRadius: 4,
    border: `1px solid ${C.line}`,
  },
  privacyWall: {
    border: `1px dashed ${C.accent}`,
    padding: "10px 14px",
    borderRadius: 4,
    textAlign: "center" as const,
    marginTop: 12,
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  ctaSection: {
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "120px 32px",
    borderTop: `1px solid ${C.line}`,
  },
  ctaContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 32,
  },
  ctaTitle: {
    fontSize: "clamp(36px, 6vw, 72px)",
    fontWeight: 700,
    letterSpacing: "-0.04em",
    lineHeight: 1.06,
    color: C.text,
    textAlign: "center" as const,
  },
  ctaArrow: {
    animation: "none",
    opacity: 0.6,
  },

  // ── App Section ───────────────────────────────────────────────────────────
  appSection: {
    minHeight: "100vh",
    padding: "40px 32px 120px",
    borderTop: `1px solid ${C.line}`,
  },
  appContainer: {
    maxWidth: 780,
    margin: "0 auto",
  },
  appWalletBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    marginBottom: 24,
  },
  appWalletLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  appConnectBtn: {
    fontFamily: FONT.body,
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    background: C.accent,
    border: "none",
    borderRadius: 6,
    padding: "8px 18px",
    cursor: "pointer",
  },
  appDisconnectBtn: {
    fontFamily: FONT.mono,
    fontSize: 12,
    color: C.muted,
    background: "none",
    border: `1px solid ${C.line}`,
    borderRadius: 6,
    padding: "6px 14px",
    cursor: "pointer",
  },
  errorBar: {
    fontSize: 13,
    color: "#FF6B6B",
    background: "rgba(255,107,107,0.08)",
    border: "1px solid rgba(255,107,107,0.2)",
    borderRadius: 6,
    padding: "12px 16px",
    marginBottom: 16,
  },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabs: {
    display: "flex",
    gap: 0,
    borderBottom: `1px solid ${C.line}`,
    marginBottom: 24,
  },
  tab: {
    fontFamily: FONT.body,
    fontSize: 13,
    fontWeight: 500,
    color: C.muted,
    background: "none",
    border: "none",
    borderBottom: `2px solid transparent`,
    padding: "10px 20px",
    cursor: "pointer",
    transition: "color 0.2s, border-color 0.2s",
    marginBottom: -1,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  tabActive: {
    color: C.text,
    borderBottomColor: C.accent,
  },
  tabCount: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: C.accent,
    background: "rgba(108,92,231,0.12)",
    padding: "1px 6px",
    borderRadius: 3,
  },

  // ── Signal Cards ──────────────────────────────────────────────────────────
  signalGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  signalCard: {
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    padding: "20px 24px",
    transition: "border-color 0.2s, transform 0.2s",
  },
  signalCardHover: {
    borderColor: C.accent,
    transform: "translateY(-2px)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  signalId: {
    fontFamily: FONT.mono,
    fontSize: 15,
    fontWeight: 500,
    color: C.text,
  },
  badge: {
    fontFamily: FONT.mono,
    fontSize: 11,
    color: C.muted,
    background: C.bg,
    padding: "2px 8px",
    borderRadius: 4,
  },
  cardDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 16,
  },
  cardRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 12,
    color: C.muted,
    fontFamily: FONT.mono,
    textTransform: "uppercase" as const,
  },
  cardMono: {
    fontFamily: FONT.mono,
    fontSize: 12,
    color: C.text,
  },
  cardPrice: {
    fontFamily: FONT.mono,
    fontSize: 13,
    fontWeight: 500,
    color: C.accent,
  },
  buyBtn: {
    width: "100%",
    padding: "10px",
    fontFamily: FONT.body,
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    background: C.accent,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  emptyState: {
    textAlign: "center" as const,
    color: C.muted,
    fontSize: 14,
    padding: 60,
  },

  // ── Create Form ───────────────────────────────────────────────────────────
  createForm: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  createLocked: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    padding: 40,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  formLabel: {
    fontFamily: FONT.mono,
    fontSize: 12,
    fontWeight: 500,
    color: C.text,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    display: "flex",
    alignItems: "baseline",
    gap: 8,
  },
  formHint: {
    fontFamily: FONT.body,
    fontSize: 11,
    fontWeight: 400,
    color: C.muted,
    textTransform: "none" as const,
    letterSpacing: 0,
  },
  input: {
    padding: "10px 14px",
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 6,
    fontSize: 14,
    fontFamily: FONT.mono,
    color: C.text,
    outline: "none",
    transition: "border-color 0.2s",
  },
  textarea: {
    padding: "10px 14px",
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 6,
    fontSize: 14,
    fontFamily: FONT.body,
    color: C.text,
    outline: "none",
    resize: "vertical" as const,
    minHeight: 120,
    transition: "border-color 0.2s",
  },
  privacyNote: {
    fontFamily: FONT.body,
    fontSize: 12,
    color: C.muted,
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 6,
    padding: "14px 16px",
    lineHeight: 1.6,
  },
  privacyNoteTitle: {
    display: "block",
    fontFamily: FONT.mono,
    fontSize: 10,
    fontWeight: 500,
    color: C.accent,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: 6,
  },
  createBtn: {
    padding: "12px",
    fontFamily: FONT.body,
    fontSize: 14,
    fontWeight: 600,
    color: C.text,
    background: C.accent,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    borderTop: `1px solid ${C.line}`,
    padding: "32px",
  },
  footerInner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: 12,
  },
  footerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  footerRight: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: 600,
    color: C.text,
  },
  footerMuted: {
    fontSize: 12,
    color: C.muted,
  },
  footerContracts: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginTop: 16,
    paddingTop: 12,
    borderTop: `1px solid ${C.line}`,
  },
  link: {
    color: C.accent,
    textDecoration: "none",
  },
};
// add loading spinner during wallet connection
// prevent double-submit on signal creation form
// add aria-labels to wallet connect/disconnect butto
// validate signal price input rejects negative value
// truncate long wallet address display properly
// handle empty signal list gracefully in browse tab
// 1785426837
// 1785426837
// 1785426837
// 1785426837
// 1785426837
// 1785426837
// 1785426837
// 1785426837
// 1785426837
// 1785426837
// 1785426838
// 1785426838
// 1785426838
// 1785426838
