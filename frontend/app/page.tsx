'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { listWallets, selectFirstWallet, connectWallet } from '@/lib/wallet';
import type { WalletState } from '@/lib/types';

declare global { interface Window { gsap?: any; ScrollTrigger?: any; } }

const CONTRACT = '5c35a52355dec9b34aa0e766c36f3588781a331fe7ebb801cf474ecdad80db3e';

export default function HomePage() {
  const [wallet, setWallet] = useState<WalletState>({ isConnected: false, address: null, coinPublicKey: null, error: null });
  const [scrolled, setScrolled] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const connect = useCallback(async () => {
    if (connecting) return;
    setConnecting(true);
    setWallet(w => ({ ...w, error: null }));
    try {
      const wallets = listWallets();
      if (!wallets.length) {
        setWallet(w => ({ ...w, error: 'Lace wallet not detected. Please install the Lace browser extension for Midnight Network.' }));
        setConnecting(false);
        return;
      }
      const api = await connectWallet(selectFirstWallet());
      const pk = await api.getCoinPublicKey();
      setWallet({ isConnected: true, address: pk.slice(0, 12) + '...' + pk.slice(-6), coinPublicKey: pk, error: null });
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Connection failed';
      setWallet(w => ({ ...w, error: msg.includes('rejected') ? 'Connection rejected. Please approve the Lace wallet prompt.' : msg }));
    } finally {
      setConnecting(false);
    }
  }, [connecting]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (!gsap || !ST) return;
    gsap.registerPlugin(ST);
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-content', { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4, ease: 'power3.out', delay: 0.1 });
      sectionRefs.current.forEach(ref => {
        if (!ref) return;
        const els = ref.querySelectorAll('.fade-up');
        if (els.length) gsap.fromTo(els, { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: ref, start: 'top 85%' } });
      });
    });
    return () => ctx.revert();
  }, []);

  const navClass = scrolled ? 'nav scrolled' : 'nav';

  return (
    <>
      <style>{css}</style>
      <div className="page">
        {/* Nav */}
        <nav className={navClass}>
          <div className="nav-inner">
            <a href="#" className="logo">NightSignals<span className="logo-dot">.</span></a>
            <div className="nav-links">
              <a href="#privacy">Privacy</a>
              <a href="#how">How</a>
              <a href="#contract">Contract</a>
              <a href="https://github.com/subheeksh5599/nightsignals" target="_blank" rel="noopener">GitHub ↗</a>
            </div>
            <div className="nav-actions">
              {wallet.isConnected ? (
                <div className="wallet-badge">
                  <span className="wallet-dot" />
                  <span className="wallet-addr">{wallet.address}</span>
                  <button onClick={() => setWallet({ isConnected: false, address: null, coinPublicKey: null, error: null })} className="btn-ghost-sm">Disconnect</button>
                </div>
              ) : (
                <>
                <button onClick={connect} disabled={connecting} className="btn-primary">
                  {connecting ? 'Connecting...' : 'Connect Lace'}
                </button>
                {wallet.error && <span className="nav-error">{wallet.error}</span>}
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-tags">
              <span>Midnight Preprod</span>
              <span className="tag-sep"></span>
              <span>Compact v0.23</span>
            </div>
            <h1 className="hero-title">
              <span className="hero-line">Privacy-preserving</span>
              <span className="hero-line accent">insight marketplace</span>
            </h1>
            <p className="hero-desc">
              Creators sell signals with cryptographic proof. Buyers verify on-chain. 
              Nobody sees the content except the two parties. Built on Midnight&apos;s selective 
              disclosure — the chain confirms the trade without ever seeing what was traded.
            </p>
            <div className="hero-actions">
              <button onClick={connect} disabled={connecting} className="btn-primary-lg">
                {connecting ? 'Connecting...' : wallet.isConnected ? 'Wallet Connected' : 'Connect Lace Wallet'}
              </button>
              <a href="#privacy" className="btn-outline-lg">Explore</a>
            </div>
            {wallet.error && <p className="hero-error">{wallet.error}</p>}
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-num">3</span>
                <span className="hero-stat-label">ZK Circuits</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-num">13</span>
                <span className="hero-stat-label">Tests Passing</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-num">50</span>
                <span className="hero-stat-label">Preprod Users</span>
              </div>
            </div>
          </div>
          <div className="hero-contract">
            <span>Contract</span>
            <code>{CONTRACT.slice(0, 10)}...{CONTRACT.slice(-8)}</code>
          </div>
        </section>

        {/* Divider */}
        <div className="divider" />

        {/* Privacy */}
        <section id="privacy" ref={el => { sectionRefs.current[0] = el; }}>
          <div className="section-hd fade-up">
            <span className="section-label">Selective Disclosure</span>
            <h2>The chain verifies the trade.<br />It never sees the content.</h2>
            <p>Every signal is proven authentic without revealing the insight. This is the primitive that Midnight enables and no transparent chain can replicate.</p>
          </div>
          <div className="privacy-grid fade-up">
            <div className="privacy-card">
              <div className="privacy-card-hd">
                <span className="privacy-icon">◈</span>
                <div>
                  <span className="privacy-card-label">Public Ledger</span>
                  <p className="privacy-card-sub">Visible to everyone</p>
                </div>
              </div>
              <div className="privacy-rows">
                {[
                  ['Content Hash', '0x3f8a...b12d', 'Anyone can verify the hash'],
                  ['Price', '50 tNIGHT', 'Listed publicly'],
                  ['Buyer Count', '3 purchases', 'Visible on-chain'],
                  ['Creator Identity', 'ZK-derived', 'Commitment, not wallet'],
                  ['Active Status', 'True', 'State on ledger'],
                ].map(([k, v, d]) => (
                  <div key={k} className="privacy-row">
                    <div>
                      <span className="privacy-key">{k}</span>
                      <span className="privacy-desc">{d}</span>
                    </div>
                    <code className="privacy-val">{v}</code>
                  </div>
                ))}
              </div>
            </div>
            <div className="privacy-card private">
              <div className="privacy-card-hd">
                <span className="privacy-icon">◆</span>
                <div>
                  <span className="privacy-card-label">Private Witness</span>
                  <p className="privacy-card-sub">Never touches the chain</p>
                </div>
              </div>
              <div className="privacy-rows">
                {[
                  ['Signal Content', 'Encrypted', 'Only creator and buyer'],
                  ['Creator Wallet', 'Untraceable', 'Hidden behind ZK identity'],
                  ['Buyer Identity', 'Shielded', 'Not stored on-chain'],
                  ['Decryption Key', 'Local witness', 'Never leaves device'],
                  ['Purchase Link', 'Not recorded', 'No transaction graph'],
                ].map(([k, v, d]) => (
                  <div key={k} className="privacy-row">
                    <div>
                      <span className="privacy-key">{k}</span>
                      <span className="privacy-desc">{d}</span>
                    </div>
                    <code className="privacy-val accent">{v}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How */}
        <section id="how" ref={el => { sectionRefs.current[1] = el; }}>
          <div className="section-hd fade-up">
            <span className="section-label">Four Steps</span>
            <h2>Every action is a<br />ZK circuit call</h2>
          </div>
          <div className="how-grid">
            {[
              { n: '01', t: 'Create Signal', b: 'Creator hashes the insight inside a ZK circuit. The content hash is disclosed to the ledger. The raw content stays in the private witness — the chain never touches it.' },
              { n: '02', t: 'Purchase Access', b: 'Buyer pays tNIGHT via receiveUnshielded. The transaction is publicly visible but no buyer identity is stored. The signal remains private between creator and buyer.' },
              { n: '03', t: 'Off-chain Delivery', b: 'Creator sends the signal content directly to the buyer through any channel — Discord, email, encrypted DM. The chain holds the proof, not the payload.' },
              { n: '04', t: 'Verify Authenticity', b: 'Buyer hashes the received content and compares it to the on-chain contentHash. A match proves the signal is authentic. A mismatch is cryptographic proof of fraud.' },
            ].map((s, i) => (
              <div key={i} className="how-card fade-up">
                <span className="how-num">{s.n}</span>
                <h3 className="how-title">{s.t}</h3>
                <p className="how-desc">{s.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contract */}
        <section id="contract" ref={el => { sectionRefs.current[2] = el; }}>
          <div className="section-hd fade-up">
            <span className="section-label">Compact v0.23</span>
            <h2>On-chain, verifiable,<br />open source</h2>
          </div>
          <div className="contract-grid fade-up">
            <div className="code-block">
              <div className="code-header">
                <span className="code-dots"><i></i><i></i><i></i></span>
                <span>nightsignals.compact</span>
              </div>
              <pre className="code-body">{`export circuit createSignal(
  price: Uint<64>,
  content: Bytes<32>
): [] {
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
            <div className="contract-meta">
              {[
                ['Network', 'Midnight Preprod'],
                ['Language', 'Compact v0.23'],
                ['Circuits', '3 (create, purchase, deactivate)'],
                ['Tests', '13/13 passing'],
                ['License', 'MIT'],
                ['Contract', CONTRACT.slice(0, 12) + '...' + CONTRACT.slice(-8)],
              ].map(([l, v]) => (
                <div key={l} className="meta-item">
                  <span className="meta-label">{l}</span>
                  <span className="meta-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Verified */}
        <section ref={el => { sectionRefs.current[3] = el; }}>
          <div className="section-hd fade-up">
            <span className="section-label">Trust Layer</span>
            <h2>Verified by the chain,<br />validated by users</h2>
          </div>
          <div className="verified-grid fade-up">
            {[
              { n: '13', l: 'Tests', d: 'Contract verification, circuit integrity, and key validation — all passing on every push.' },
              { n: '50', l: 'Users', d: 'Verifiable preprod wallet addresses with on-chain activity on the nightsignals contract.' },
              { n: '3', l: 'Circuits', d: 'createSignal for listing, purchaseSignal for buying, deactivateSignal for lifecycle management.' },
              { n: '4.3', l: 'Rating', d: 'Average user satisfaction across 50 structured feedback responses from real testers.' },
            ].map((s, i) => (
              <div key={i} className="verified-card fade-up">
                <span className="verified-num">{s.n}</span>
                <span className="verified-label">{s.l}</span>
                <p className="verified-desc">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quote */}
        <section className="quote-section fade-up">
          <blockquote>
            <p>&ldquo;Anyone can claim a 90% win rate. There&apos;s no cryptographic proof. NightSignals changes that — immutable content hashes on-chain make creator reputation verifiable, not claimed.&rdquo;</p>
          </blockquote>
        </section>

        {/* CTA */}
        <section className="cta fade-up">
          <h2>Trade with proof,<br />not trust.</h2>
          <p>Connect your Lace wallet to create and purchase signals on Midnight Preprod. Every transaction is a ZK circuit call — verifiable, private, and immutable.</p>
          <div className="cta-actions">
            <button onClick={connect} disabled={connecting} className="btn-primary-lg">
              {connecting ? 'Connecting...' : wallet.isConnected ? 'Launch App' : 'Connect Lace Wallet'}
            </button>
            {wallet.error && <p className="cta-error">{wallet.error}</p>}
            <a href="https://github.com/subheeksh5599/nightsignals" target="_blank" rel="noopener" className="btn-outline-lg">GitHub</a>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <span className="footer-logo">NightSignals<span className="logo-dot">.</span></span>
              <span className="footer-by">Built for Midnight Network. MIT Licensed.</span>
            </div>
            <div className="footer-links">
              <a href="https://github.com/subheeksh5599/nightsignals" target="_blank" rel="noopener">GitHub</a>
              <a href="https://x.com/NightSignals_" target="_blank" rel="noopener">X / Twitter</a>
              <a href="https://midnight.network" target="_blank" rel="noopener">Midnight</a>
            </div>
          </div>
        </footer>
      </div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" async />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" async />
    </>
  );
}

const css = `
  :root {
    --bg: #08080c;
    --surface: #111118;
    --surface2: #181820;
    --border: rgba(255,255,255,0.06);
    --border2: rgba(255,255,255,0.10);
    --text: #e8e8ed;
    --text2: rgba(232,232,237,0.60);
    --text3: rgba(232,232,237,0.35);
    --accent: #6C5CE7;
    --accent2: #7B6CF6;
    --radius: 12px;
    --radius-sm: 8px;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
  ::selection { background: var(--accent); color: #fff; }
  .page { min-height: 100vh; overflow-x: hidden; }

  /* Nav */
  .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 18px 0; transition: all 0.3s; }
  .nav.scrolled { background: rgba(8,8,12,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); }
  .nav-inner { max-width: 1240px; margin: 0 auto; padding: 0 40px; display: flex; align-items: center; justify-content: space-between; }
  .logo { font-size: 20px; font-weight: 700; color: var(--text); text-decoration: none; letter-spacing: -0.02em; }
  .logo-dot { color: var(--accent); }
  .nav-links { display: flex; gap: 36px; align-items: center; }
  .nav-links a { font-size: 13px; font-weight: 500; color: var(--text2); text-decoration: none; letter-spacing: 0.02em; transition: color 0.2s; }
  .nav-links a:hover { color: var(--text); }
  .nav-actions { display: flex; align-items: center; gap: 16px; }

  /* Hero */
  .hero { max-width: 1240px; margin: 0 auto; padding: 200px 40px 120px; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; position: relative; }
  .hero-content { max-width: 680px; }
  .hero-tags { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; font-size: 12px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em; font-family: 'JetBrains Mono', monospace; }
  .tag-sep { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); }
  .hero-title { font-size: clamp(48px, 7vw, 80px); font-weight: 700; line-height: 1.06; letter-spacing: -0.03em; margin-bottom: 28px; }
  .hero-line { display: block; }
  .hero-line.accent { color: var(--accent); }
  .hero-desc { font-size: 17px; line-height: 1.7; color: var(--text2); max-width: 560px; margin-bottom: 40px; }
  .hero-actions { display: flex; gap: 16px; margin-bottom: 64px; }
  .hero-stats { display: flex; gap: 48px; padding-top: 32px; border-top: 1px solid var(--border); }
  .hero-stat { display: flex; flex-direction: column; gap: 4px; }
  .hero-stat-num { font-size: 32px; font-weight: 700; color: var(--accent); font-family: 'JetBrains Mono', monospace; }
  .hero-stat-label { font-size: 13px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }
  .hero-contract { position: absolute; bottom: 60px; right: 40px; display: flex; align-items: center; gap: 12px; padding: 10px 18px; border: 1px solid var(--border2); border-radius: var(--radius-sm); font-size: 12px; color: var(--text3); }
  .hero-contract span { text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; font-size: 10px; }
  .hero-contract code { font-family: 'JetBrains Mono', monospace; color: var(--text2); }

  /* Divider */
  .divider { max-width: 1240px; margin: 0 auto; padding: 0 40px; }
  .divider::after { content: ''; display: block; height: 1px; background: var(--border); }

  /* Sections */
  section { max-width: 1240px; margin: 0 auto; padding: 140px 40px; }
  .section-hd { margin-bottom: 72px; max-width: 600px; }
  .section-label { font-size: 11px; font-weight: 600; color: var(--accent); text-transform: uppercase; letter-spacing: 0.12em; font-family: 'JetBrains Mono', monospace; margin-bottom: 20px; display: block; }
  .section-hd h2 { font-size: clamp(32px, 5vw, 52px); font-weight: 700; line-height: 1.12; letter-spacing: -0.02em; margin-bottom: 16px; }
  .section-hd p { font-size: 16px; line-height: 1.7; color: var(--text2); }

  /* Privacy */
  .privacy-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; background: var(--border); }
  .privacy-card { background: var(--surface); padding: 40px; }
  .privacy-card.private { border-left: 1px solid var(--border); }
  .privacy-card-hd { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 32px; }
  .privacy-icon { font-size: 20px; color: var(--accent); margin-top: 2px; }
  .privacy-card.private .privacy-icon { color: var(--accent2); }
  .privacy-card-label { font-size: 15px; font-weight: 600; color: var(--text); display: block; margin-bottom: 2px; }
  .privacy-card-sub { font-size: 13px; color: var(--text3); }
  .privacy-rows { display: flex; flex-direction: column; }
  .privacy-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--border); }
  .privacy-row:last-child { border-bottom: none; }
  .privacy-key { font-size: 13px; font-weight: 500; color: var(--text2); display: block; margin-bottom: 2px; }
  .privacy-desc { font-size: 11px; color: var(--text3); }
  .privacy-val { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text); }
  .privacy-val.accent { color: var(--accent2); }

  /* How */
  .how-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; background: var(--border); }
  .how-card { background: var(--surface); padding: 36px; position: relative; }
  .how-num { font-size: 12px; font-weight: 600; color: var(--accent); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; margin-bottom: 20px; display: block; }
  .how-title { font-size: 18px; font-weight: 600; margin-bottom: 12px; letter-spacing: -0.01em; }
  .how-desc { font-size: 13px; line-height: 1.7; color: var(--text2); }

  /* Contract */
  .contract-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; align-items: start; }
  .code-block { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .code-header { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid var(--border); font-size: 12px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }
  .code-dots { display: flex; gap: 6px; }
  .code-dots i { width: 8px; height: 8px; border-radius: 50%; background: var(--border2); display: block; }
  .code-dots i:first-child { background: #ff5f56; }
  .code-dots i:nth-child(2) { background: #ffbd2e; }
  .code-body { padding: 24px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.8; color: var(--text2); overflow-x: auto; white-space: pre; margin: 0; }
  .contract-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; background: var(--border); }
  .meta-item { background: var(--surface); padding: 20px 24px; }
  .meta-label { font-size: 10px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em; font-family: 'JetBrains Mono', monospace; display: block; margin-bottom: 6px; }
  .meta-val { font-size: 14px; font-weight: 500; color: var(--text); font-family: 'JetBrains Mono', monospace; word-break: break-all; }

  /* Verified */
  .verified-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; background: var(--border); }
  .verified-card { background: var(--surface); padding: 36px 28px; text-align: center; }
  .verified-num { font-size: 44px; font-weight: 700; color: var(--accent); font-family: 'JetBrains Mono', monospace; display: block; margin-bottom: 8px; }
  .verified-label { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 10px; }
  .verified-desc { font-size: 13px; line-height: 1.6; color: var(--text2); }

  /* Quote */
  .quote-section { max-width: 800px; margin: 0 auto; padding: 0 40px 100px; }
  .quote-section blockquote { border-left: 3px solid var(--accent); padding-left: 32px; }
  .quote-section p { font-size: 22px; line-height: 1.5; color: var(--text2); font-style: italic; font-weight: 400; }

  /* CTA */
  .cta { text-align: center; padding: 140px 40px 160px; }
  .cta h2 { font-size: clamp(36px, 5vw, 56px); font-weight: 700; letter-spacing: -0.02em; margin-bottom: 20px; }
  .cta p { font-size: 17px; line-height: 1.7; color: var(--text2); max-width: 560px; margin: 0 auto 36px; }
  .cta-actions { display: flex; gap: 16px; justify-content: center; }

  /* Footer */
  .footer { border-top: 1px solid var(--border); padding: 48px 40px; }
  .footer-inner { max-width: 1240px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .footer-brand { display: flex; flex-direction: column; gap: 6px; }
  .footer-logo { font-size: 16px; font-weight: 700; }
  .footer-by { font-size: 12px; color: var(--text3); }
  .footer-links { display: flex; gap: 32px; }
  .footer-links a { font-size: 13px; color: var(--text2); text-decoration: none; transition: color 0.2s; }
  .footer-links a:hover { color: var(--text); }

  /* Buttons */
  .btn-primary, .btn-primary-lg { padding: 12px 28px; border-radius: var(--radius-sm); border: none; background: var(--accent); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
  .btn-primary:hover, .btn-primary-lg:hover { background: var(--accent2); }
  .btn-primary-lg { padding: 16px 36px; font-size: 15px; border-radius: var(--radius); }
  .btn-outline-lg { padding: 16px 36px; border-radius: var(--radius); border: 1px solid var(--border2); background: transparent; color: var(--text); font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; text-decoration: none; display: inline-flex; align-items: center; transition: border-color 0.2s; }
  .btn-outline-lg:hover { border-color: var(--text3); }
  .btn-primary:disabled, .btn-primary-lg:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-ghost-sm { padding: 6px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: transparent; color: var(--text2); font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; }
  .nav-error { font-size: 11px; color: #ff5f56; max-width: 200px; line-height: 1.4; }
  .hero-error { font-size: 14px; color: #ff5f56; margin-top: 12px; }
  .cta-error { font-size: 14px; color: #ff5f56; margin-top: 12px; }

  /* Wallet */
  .wallet-badge { display: flex; align-items: center; gap: 10px; }
  .wallet-dot { width: 7px; height: 7px; border-radius: 50%; background: #3fb950; }
  .wallet-addr { font-size: 12px; font-family: 'JetBrains Mono', monospace; color: var(--text3); }

  /* Responsive */
  @media (max-width: 900px) {
    .nav-links { display: none; }
    .privacy-grid, .how-grid, .verified-grid { grid-template-columns: 1fr; }
    .contract-grid { grid-template-columns: 1fr; }
    .hero { padding: 160px 24px 80px; }
    section { padding: 80px 24px; }
    .hero-stats { gap: 24px; flex-wrap: wrap; }
    .hero-contract { display: none; }
  }

  @media (max-width: 600px) {
    .hero-title { font-size: 40px; }
    .section-hd h2 { font-size: 28px; }
    .footer-inner { flex-direction: column; gap: 24px; text-align: center; }
    .footer-links { gap: 20px; }
  }
`;
