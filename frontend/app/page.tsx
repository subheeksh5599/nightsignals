'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { listWallets, selectFirstWallet, connectWallet } from '@/lib/wallet';
import type { WalletState } from '@/lib/types';

declare global { interface Window { gsap?: any; ScrollTrigger?: any; } }

const CONTRACT = '5c35a52355dec9b34aa0e766c36f3588781a331fe7ebb801cf474ecdad80db3e';
const FF = { mono: "'JetBrains Mono', monospace", sans: "'Inter', sans-serif" };

const publicData = [
  ['content hash', '0x3f8a...b12d'],
  ['price', '50 tNIGHT'],
  ['buyer count', '3'],
  ['creator identity', 'ZK-derived commitment'],
  ['active status', 'true/false'],
];
const privateData = [
  ['signal content', 'encrypted, off-chain'],
  ['creator wallet', 'untraceable'],
  ['buyer identity', 'shielded'],
  ['decryption key', 'local witness only'],
  ['purchase link', 'not stored'],
];
const steps = [
  ['01', 'Create', 'Creator hashes the signal content with a domain-separated prefix inside a ZK circuit. Price and content hash are disclosed to the public ledger. The raw content stays in the private witness.'],
  ['02', 'Purchase', "Buyer calls purchaseSignal, paying tNIGHT via receiveUnshielded. The transaction is publicly visible but the buyer's wallet address is not stored anywhere in the contract."],
  ['03', 'Deliver', 'Creator sends the actual signal content to the buyer off-chain. Discord, email, encrypted DM. Any channel works. The chain holds the proof, not the payload.'],
  ['04', 'Verify', 'Buyer hashes the received content with the same domain prefix and compares to the on-chain contentHash. A match proves authenticity. A mismatch is cryptographic proof of fraud.'],
];
const metaFields = [
  ['Network', 'Midnight Preprod'],
  ['Address', CONTRACT],
  ['Language', 'Compact v0.23'],
  ['Circuits', '3 (create, purchase, deactivate)'],
];
const statsData = [
  ['13', 'Tests Passing', 'Contract verification, circuit integrity, key validation'],
  ['50', 'Preprod Users', 'Verifiable wallet addresses with on-chain activity'],
  ['3', 'ZK Circuits', 'createSignal, purchaseSignal, deactivateSignal'],
  ['4.3', 'User Rating', 'Average satisfaction across 50 structured feedback responses'],
];

export default function HomePage() {
  const [wallet, setWallet] = useState<WalletState>({ isConnected: false, address: null, coinPublicKey: null, error: null });
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const privacyRef = useRef<HTMLElement>(null);
  const howRef = useRef<HTMLElement>(null);
  const contractRef = useRef<HTMLElement>(null);
  const trustRef = useRef<HTMLElement>(null);

  const handleConnect = useCallback(async () => {
    try {
      setWallet(w => ({ ...w, error: null }));
      const wallets = listWallets();
      if (!wallets.length) { setWallet(w => ({ ...w, error: 'No Midnight wallet found. Install Lace.' })); return; }
      const api = await connectWallet(selectFirstWallet());
      const pk = await api.getCoinPublicKey();
      setWallet({ isConnected: true, address: pk.slice(0, 12) + '...' + pk.slice(-6), coinPublicKey: pk, error: null });
    } catch (err: unknown) {
      setWallet(w => ({ ...w, error: (err as Error)?.message || 'Connection failed' }));
    }
  }, []);

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
      gsap.fromTo('[data-hero]', { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, ease: 'power3.out', delay: 0.2 });
      [privacyRef, howRef, contractRef, trustRef].forEach(ref => {
        if (!ref.current) return;
        const els = ref.current.querySelectorAll('[data-fade]');
        if (els.length) gsap.fromTo(els, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: ref.current, start: 'top 80%' } });
      });
    });
    return () => ctx.revert();
  }, []);

  const navBg = scrolled ? 'rgba(10,10,10,0.92)' : 'transparent';
  const navBorder = scrolled ? '1px solid rgba(235,235,229,0.08)' : '1px solid transparent';

  return (
    <div style={{ background: '#0A0A0A', color: '#EBEBE5', minHeight: '100vh', overflowX: 'hidden', fontFamily: FF.sans }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '16px 0', background: navBg, borderBottom: navBorder, backdropFilter: 'blur(12px)', transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="#" style={{ fontSize: 18, fontWeight: 700, color: '#EBEBE5', textDecoration: 'none' }}>NightSignals</a>
          <div className="hide-mobile" style={{ display: 'flex', gap: 32 }}>
            <a href="#privacy" style={navLink}>Privacy</a>
            <a href="#contract" style={navLink}>Contract</a>
            <a href="https://github.com/subheeksh5599/nightsignals" target="_blank" rel="noopener" style={navLink}>GitHub</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {wallet.isConnected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3fb950' }} />
                <span style={{ fontSize: 12, fontFamily: FF.mono, color: 'rgba(235,235,229,0.45)' }}>{wallet.address}</span>
                <button onClick={() => setWallet({ isConnected: false, address: null, coinPublicKey: null, error: null })} style={btnGhost}>Disconnect</button>
              </div>
            ) : (
              <button onClick={handleConnect} style={btnPrimary}>Connect Lace</button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} style={{ padding: '200px 32px 120px', maxWidth: 1280, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div data-hero style={{ maxWidth: 780 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            <span style={tag}>Midnight Preprod</span>
            <span style={tag}>Compact v0.23</span>
          </div>
          <h1 style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24 }}>the insight is proven,<br />not shown</h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(235,235,229,0.45)', maxWidth: 560, marginBottom: 40 }}>
            A privacy-preserving marketplace for trading signals. Creators sell insights with cryptographic proof of authenticity. Buyers verify on-chain without the content ever touching the public ledger. Built on Midnight&apos;s selective disclosure.
          </p>
          <div style={{ display: 'flex', gap: 16, marginBottom: 48 }}>
            <button onClick={handleConnect} style={btnPrimary}>{wallet.isConnected ? 'Connected' : 'Connect Lace Wallet'}</button>
            <a href="#contract" style={btnGhost}>View Contract</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={monoLabel}>Contract {CONTRACT.slice(0, 8)}...{CONTRACT.slice(-6)}</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(235,235,229,0.08)' }} />
            <span style={monoLabel}>13 tests passing</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(235,235,229,0.08)' }} />
            <span style={monoLabel}>3 ZK circuits</span>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" ref={privacyRef} className="section">
        <div className="section-hd">
          <span className="section-num">01</span>
          <h2 className="section-title">Privacy Model</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(235,235,229,0.45)' }}>
            What an observer can and cannot learn from the public ledger. Selective disclosure is the core primitive. The chain verifies the trade without ever seeing what was traded.
          </p>
        </div>
        <div className="grid-2" style={{ border: '1px solid rgba(235,235,229,0.08)', borderRadius: 8, overflow: 'hidden' }}>
          <div data-fade style={cell}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', fontFamily: FF.mono, letterSpacing: '0.08em', color: '#EBEBE5', marginBottom: 24 }}>Public — stored on-chain</div>
            {publicData.map(([k, v]) => (
              <div key={k} style={row}><span style={keyStyle}>{k}</span><span style={valStyle}>{v}</span></div>
            ))}
          </div>
          <div data-fade style={cell}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', fontFamily: FF.mono, letterSpacing: '0.08em', color: '#6C5CE7', marginBottom: 24 }}>Private — never leaves the witness</div>
            {privateData.map(([k, v]) => (
              <div key={k} style={row}><span style={keyStyle}>{k}</span><span style={{ ...valStyle, color: '#6C5CE7' }}>{v}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" ref={howRef} className="section">
        <div className="section-hd">
          <span className="section-num">02</span>
          <h2 className="section-title">How It Works</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(235,235,229,0.45)' }}>Four steps from creation to verification. Every action is a ZK circuit call on Midnight.</p>
        </div>
        <div className="grid-4" style={{ border: '1px solid rgba(235,235,229,0.08)', borderRadius: 8, overflow: 'hidden' }}>
          {steps.map(([n, t, b]) => (
            <div key={n} data-fade style={cell}>
              <span className="section-num">{n}</span>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '16px 0 8px' }}>{t}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(235,235,229,0.45)' }}>{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contract */}
      <section id="contract" ref={contractRef} className="section">
        <div className="section-hd">
          <span className="section-num">03</span>
          <h2 className="section-title">Contract</h2>
        </div>
        <div data-fade style={{ background: '#141414', border: '1px solid rgba(235,235,229,0.08)', borderRadius: 8, padding: 32, marginBottom: 32, overflow: 'auto' }}>
          <pre style={{ fontFamily: FF.mono, fontSize: 12, lineHeight: 1.7, color: 'rgba(235,235,229,0.45)', margin: 0 }}>{`pragma language_version 0.23;

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
        <div data-fade className="grid-4" style={{ border: '1px solid rgba(235,235,229,0.08)', borderRadius: 8, overflow: 'hidden' }}>
          {metaFields.map(([l, v]) => (
            <div key={l} style={{ background: '#141414', padding: '20px 24px', border: '1px solid rgba(235,235,229,0.08)' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(235,235,229,0.45)', textTransform: 'uppercase', fontFamily: FF.mono, letterSpacing: '0.08em' }}>{l}</span>
              <div style={{ fontSize: 13, color: '#EBEBE5', marginTop: 4, fontFamily: l === 'Address' ? FF.mono : undefined }}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section ref={trustRef} className="section">
        <div className="section-hd">
          <span className="section-num">04</span>
          <h2 className="section-title">Verified</h2>
        </div>
        <div className="grid-4" style={{ border: '1px solid rgba(235,235,229,0.08)', borderRadius: 8, overflow: 'hidden' }}>
          {statsData.map(([stat, label, desc]) => (
            <div key={label} data-fade style={{ background: '#141414', padding: 32, border: '1px solid rgba(235,235,229,0.08)', textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: '#6C5CE7', fontFamily: FF.mono, marginBottom: 8 }}>{stat}</div>
              <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'rgba(235,235,229,0.45)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 32px 160px', textAlign: 'center' }}>
        <div data-fade style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>Ready to trade with proof, not trust?</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(235,235,229,0.45)', marginBottom: 32 }}>
            Connect your Lace wallet to create and purchase signals on Midnight Preprod. Every transaction is a ZK circuit call. Verifiable, private, and immutable.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button onClick={handleConnect} style={btnPrimary}>{wallet.isConnected ? 'Launch App' : 'Connect Lace Wallet'}</button>
            <a href="https://github.com/subheeksh5599/nightsignals" target="_blank" rel="noopener" style={btnGhost}>View on GitHub</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(235,235,229,0.08)', padding: '40px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>NightSignals</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="https://github.com/subheeksh5599/nightsignals" target="_blank" rel="noopener" style={{ fontSize: 12, color: 'rgba(235,235,229,0.45)', textDecoration: 'none', fontFamily: FF.mono }}>GitHub</a>
            <a href="https://x.com/NightSignals_" target="_blank" rel="noopener" style={{ fontSize: 12, color: 'rgba(235,235,229,0.45)', textDecoration: 'none', fontFamily: FF.mono }}>X</a>
            <a href="https://midnight.network" target="_blank" rel="noopener" style={{ fontSize: 12, color: 'rgba(235,235,229,0.45)', textDecoration: 'none', fontFamily: FF.mono }}>Midnight</a>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(235,235,229,0.45)' }}>MIT Licensed. Built for Midnight Network.</span>
        </div>
      </footer>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" async />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" async />
    </div>
  );
}

// Shared styles
const navLink: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: 'rgba(235,235,229,0.45)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.03em' };
const btnPrimary: React.CSSProperties = { padding: '12px 28px', borderRadius: 6, border: 'none', background: '#6C5CE7', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FF.sans };
const btnGhost: React.CSSProperties = { padding: '12px 28px', borderRadius: 6, border: '1px solid rgba(235,235,229,0.08)', background: 'transparent', color: '#EBEBE5', fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontFamily: FF.sans };
const tag: React.CSSProperties = { padding: '4px 12px', borderRadius: 4, border: '1px solid rgba(235,235,229,0.08)', fontSize: 11, fontWeight: 600, color: 'rgba(235,235,229,0.45)', textTransform: 'uppercase', fontFamily: FF.mono, letterSpacing: '0.05em' };
const monoLabel: React.CSSProperties = { fontSize: 12, fontFamily: FF.mono, color: 'rgba(235,235,229,0.45)' };
const cell: React.CSSProperties = { background: '#141414', padding: 32, border: '1px solid rgba(235,235,229,0.08)' };
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(235,235,229,0.08)' };
const keyStyle: React.CSSProperties = { fontSize: 13, color: 'rgba(235,235,229,0.45)' };
const valStyle: React.CSSProperties = { fontSize: 13, fontFamily: FF.mono, color: '#EBEBE5' };
