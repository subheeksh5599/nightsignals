import React, { useState, useCallback } from "react";
import type { SignalInfo, WalletState, API } from "./types";
import { listWallets, selectFirstWallet, connectWallet } from "./wallet";

// ─── Mock signals (replace with indexer query in production) ─────────────────

const MOCK_SIGNALS: SignalInfo[] = [
  {
    id: 1,
    creator: "0x7a3b...9f2c",
    price: 50,
    contentHash: "0x3f8a...b12d",
    active: true,
    buyerCount: 3,
  },
  {
    id: 2,
    creator: "0x1c4d...8e1a",
    price: 100,
    contentHash: "0xa2b4...c7f3",
    active: true,
    buyerCount: 7,
  },
];

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    coinPublicKey: null,
    error: null,
  });
  const [api, setApi] = useState<API | null>(null);
  const [signals, setSignals] = useState<SignalInfo[]>(MOCK_SIGNALS);
  const [activeTab, setActiveTab] = useState<"browse" | "create">("browse");

  // Create signal form state
  const [createPrice, setCreatePrice] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Purchase state
  const [purchasing, setPurchasing] = useState<number | null>(null);

  // ─── Wallet handlers ────────────────────────────────────────────────────

  const handleConnect = useCallback(async () => {
    try {
      setWallet((w) => ({ ...w, error: null }));
      const wallets = listWallets();
      if (wallets.length === 0) {
        setWallet((w) => ({
          ...w,
          error: "No Midnight wallet found. Please install Lace.",
        }));
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
    } catch (err: any) {
      setWallet((w) => ({
        ...w,
        error: err?.message || "Failed to connect wallet",
      }));
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setApi(null);
    setWallet({
      isConnected: false,
      address: null,
      coinPublicKey: null,
      error: null,
    });
  }, []);

  // ─── Signal handlers ────────────────────────────────────────────────────

  const handleCreateSignal = useCallback(async () => {
    if (!api) return;
    const price = parseInt(createPrice);
    if (!price || price <= 0) return;
    if (!createContent.trim()) return;

    setCreateLoading(true);
    try {
      // In production: call deployed contract's createSignal circuit
      // const tx = await deployed.callTx.createSignal(BigInt(price), new TextEncoder().encode(createContent));

      // Mock: add to local state
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
    } catch (err: any) {
      setWallet((w) => ({ ...w, error: err?.message || "Failed to create signal" }));
    } finally {
      setCreateLoading(false);
    }
  }, [api, createPrice, createContent, signals.length, wallet.coinPublicKey]);

  const handlePurchase = useCallback(
    async (signalId: number) => {
      if (!api) return;
      setPurchasing(signalId);
      try {
        // In production: call deployed contract's purchaseSignal circuit
        // const tx = await deployed.callTx.purchaseSignal(BigInt(signalId));
        await new Promise((r) => setTimeout(r, 1000)); // simulate tx
        setSignals((prev) =>
          prev.map((s) =>
            s.id === signalId ? { ...s, buyerCount: s.buyerCount + 1 } : s
          )
        );
      } catch (err: any) {
        setWallet((w) => ({ ...w, error: err?.message || "Purchase failed" }));
      } finally {
        setPurchasing(null);
      }
    },
    [api]
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>NightSignals 🌙</h1>
          <p style={styles.subtitle}>
            Privacy-preserving insight marketplace on Midnight
          </p>
        </div>
        <div style={styles.walletArea}>
          {wallet.isConnected ? (
            <div style={styles.walletCard}>
              <span style={styles.statusDot} title="Connected">●</span>
              <span style={styles.address}>{wallet.address}</span>
              <button style={styles.disconnectBtn} onClick={handleDisconnect}>
                Disconnect
              </button>
            </div>
          ) : (
            <button style={styles.connectBtn} onClick={handleConnect}>
              Connect Lace Wallet
            </button>
          )}
        </div>
      </header>

      {wallet.error && (
        <div style={styles.error}>
          ⚠ {wallet.error}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "browse" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("browse")}
        >
          Browse Signals ({signals.filter((s) => s.active).length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "create" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("create")}
        >
          Create Signal
        </button>
      </div>

      {/* Browse tab */}
      {activeTab === "browse" && (
        <div style={styles.signalGrid}>
          {signals.filter((s) => s.active).length === 0 ? (
            <p style={styles.empty}>No active signals. Create one!</p>
          ) : (
            signals
              .filter((s) => s.active)
              .map((signal) => (
                <div key={signal.id} style={styles.signalCard}>
                  <div style={styles.signalHeader}>
                    <span style={styles.signalId}>#{signal.id}</span>
                    <span style={styles.badge}>
                      {signal.buyerCount} purchase{signal.buyerCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={styles.signalDetails}>
                    <div style={styles.detailRow}>
                      <span style={styles.label}>Creator</span>
                      <span style={styles.mono}>{signal.creator}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.label}>Content Hash</span>
                      <span style={styles.mono}>{signal.contentHash}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.label}>Price</span>
                      <span style={styles.price}>{signal.price} tNIGHT</span>
                    </div>
                  </div>
                  <button
                    style={{
                      ...styles.buyBtn,
                      ...(purchasing === signal.id || !wallet.isConnected
                        ? styles.disabledBtn
                        : {}),
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

      {/* Create tab */}
      {activeTab === "create" && (
        <div style={styles.createForm}>
          {!wallet.isConnected ? (
            <p style={styles.empty}>Connect your Lace wallet to create signals.</p>
          ) : (
            <>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Price (tNIGHT)</label>
                <input
                  type="number"
                  min="1"
                  value={createPrice}
                  onChange={(e) => setCreatePrice(e.target.value)}
                  placeholder="e.g. 50"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>
                  Signal Content{" "}
                  <span style={styles.privateHint}>(private — never stored on-chain)</span>
                </label>
                <textarea
                  value={createContent}
                  onChange={(e) => setCreateContent(e.target.value)}
                  placeholder="Your trading insight, analysis, or strategy..."
                  rows={5}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.privacyNote}>
                <strong>🔒 Privacy:</strong> Only the content hash is stored on-chain.
                The signal content stays in your local private witness. Buyers verify
                the content matches the hash off-chain.
              </div>
              <button
                style={{
                  ...styles.createBtn,
                  ...(createLoading ? styles.disabledBtn : {}),
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

      {/* Footer */}
      <footer style={styles.footer}>
        <p>
          Built on{" "}
          <a
            href="https://midnight.network"
            target="_blank"
            rel="noopener"
            style={styles.link}
          >
            Midnight Network
          </a>{" "}
          · Compact v0.23 ·{" "}
          <a
            href="https://github.com/subheeksh5599/nightsignals"
            target="_blank"
            rel="noopener"
            style={styles.link}
          >
            GitHub
          </a>
        </p>
        <p style={styles.privacyModel}>
          <strong>Privacy model:</strong> Public ledger stores creator ZK-identity,
          price, content hash, and buyer count. Signal content and buyer identities
          remain private.
        </p>
      </footer>
    </div>
  );
}

// ─── Inline styles (compact, no external CSS) ─────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "24px 16px",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#0a0a0a",
    background: "#faf8f4",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "2px solid #0a0a0a",
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    margin: 0,
    color: "#0a0a0a",
  },
  subtitle: {
    fontSize: 14,
    color: "#5a5a5a",
    margin: "4px 0 0",
  },
  walletArea: { display: "flex", alignItems: "center", gap: 8 },
  walletCard: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#0a0a0a",
    color: "#faf8f4",
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: 13,
  },
  statusDot: { color: "#4ade80", fontSize: 10 },
  address: { fontFamily: "monospace", fontSize: 12 },
  connectBtn: {
    padding: "10px 20px",
    background: "#0a0a0a",
    color: "#faf8f4",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  disconnectBtn: {
    padding: "4px 10px",
    background: "#333",
    color: "#faf8f4",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
  error: {
    padding: "12px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    color: "#991b1b",
    fontSize: 13,
    marginBottom: 16,
  },
  tabs: {
    display: "flex",
    gap: 0,
    marginBottom: 24,
    borderBottom: "2px solid #e5e5e5",
  },
  tab: {
    padding: "10px 20px",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "#5a5a5a",
    marginBottom: -2,
  },
  activeTab: {
    color: "#0a0a0a",
    borderBottom: "2px solid #0a0a0a",
  },
  signalGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  signalCard: {
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 10,
    padding: 16,
  },
  signalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  signalId: { fontSize: 18, fontWeight: 700, color: "#0a0a0a" },
  badge: {
    fontSize: 12,
    background: "#f0ede7",
    padding: "2px 8px",
    borderRadius: 12,
    color: "#5a5a5a",
  },
  signalDetails: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 },
  detailRow: { display: "flex", justifyContent: "space-between", fontSize: 13 },
  label: { color: "#5a5a5a" },
  mono: { fontFamily: "monospace", fontSize: 11, color: "#0a0a0a" },
  price: { fontWeight: 700, color: "#0a0a0a" },
  buyBtn: {
    width: "100%",
    padding: "10px",
    background: "#0a0a0a",
    color: "#faf8f4",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  empty: {
    textAlign: "center",
    color: "#5a5a5a",
    padding: 40,
    fontSize: 14,
  },
  createForm: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0a0a0a",
  },
  privateHint: {
    color: "#5a5a5a",
    fontWeight: 400,
    fontSize: 11,
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #e5e5e5",
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "monospace",
  },
  textarea: {
    padding: "10px 12px",
    border: "1px solid #e5e5e5",
    borderRadius: 6,
    fontSize: 14,
    resize: "vertical",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  privacyNote: {
    fontSize: 12,
    color: "#5a5a5a",
    background: "#f0ede7",
    padding: "10px 12px",
    borderRadius: 6,
    lineHeight: 1.5,
  },
  createBtn: {
    padding: "12px",
    background: "#0a0a0a",
    color: "#faf8f4",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  footer: {
    marginTop: 40,
    paddingTop: 16,
    borderTop: "1px solid #e5e5e5",
    fontSize: 12,
    color: "#5a5a5a",
    textAlign: "center",
  },
  privacyModel: {
    marginTop: 8,
    color: "#5a5a5a",
    fontSize: 11,
  },
  link: {
    color: "#0a0a0a",
    textDecoration: "underline",
  },
};
