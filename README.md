# NightSignals 🌙

<div align="center">

![Midnight](https://img.shields.io/badge/Midnight-Network-000?style=flat-square)
![Compact](https://img.shields.io/badge/Compact-0.23-000?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-000?style=flat-square)
![CI](https://img.shields.io/badge/CI-passing-brightgreen?style=flat-square)

**Privacy-preserving insight marketplace on Midnight Network**

[Features](#features) · [Architecture](#architecture) · [Privacy Model](#privacy-model) · [Setup](#setup) · [Deploy](#deploy)

</div>

---

## What is NightSignals?

NightSignals is a decentralized marketplace where traders and analysts sell market insights without exposing their strategies publicly. Built on Midnight Network's selective disclosure model, it lets creators prove their track record on-chain while keeping signal content private.

**The insight is proven, not shown.**

---

## Features

1. **Create private signals** — list an insight with a price. The content hash goes on-chain; the content stays in your private witness.

2. **Purchase with proof** — buyers pay tNIGHT, the transaction is publicly verifiable, and buyer count updates atomically.

3. **Creator-controlled deactivation** — only the signal creator can deactivate their listing. Proves ownership via ZK-derived identity.

4. **Verifiable content hash** — buyers can verify the signal they received matches the on-chain hash without the content ever touching the public ledger.

5. **Fully on-chain state** — all listings, purchases, and metadata live on Midnight's public ledger. Queryable via the indexer GraphQL API.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    NightSignals                      │
├─────────────────────────────────────────────────────┤
│  Public Ledger (on-chain)                            │
│  ┌─────────────────────────────────────────────────┐ │
│  │  signals: Map<Uint<64>, SignalInfo>             │ │
│  │  nextId: Counter                                 │ │
│  │                                                   │ │
│  │  SignalInfo {                                    │ │
│  │    creator: Bytes<32>    ← ZK-derived identity   │ │
│  │    price: Uint<64>       ← tNIGHT cost           │ │
│  │    contentHash: Bytes<32> ← verifiable hash      │ │
│  │    active: Boolean                                │ │
│  │    buyerCount: Uint<64>                           │ │
│  │  }                                               │ │
│  └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  Private Witness (per-user, local)                    │
│  ┌─────────────────────────────────────────────────┐ │
│  │  localSecretKey()     ← user's secret            │ │
│  │  signal content       ← never touches chain      │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Circuits

| Circuit | Visibility | Description |
|---------|------------|-------------|
| `createSignal(price, content)` | Mixed | Creates listing — price and hash public, content private |
| `purchaseSignal(signalId)` | Public | Pays tNIGHT, increments buyer count |
| `deactivateSignal(signalId)` | Public | Creator-only deactivation |
| `ownerCommitment(sk)` | Public | Derives ZK identity from secret key |

---

## Privacy Model

### What an observer CAN learn from the public ledger:
- How many signals exist, their prices, and whether they're active
- The creator's ZK-derived identity (not their wallet address)
- Content hashes (can verify but not read content)
- How many times each signal was purchased
- When each signal was created

### What an observer CANNOT learn:
- The actual signal content (trading insight, analysis, strategy)
- The creator's real wallet address (only ZK-derived identity)
- Who purchased which signal (buyer identities are not tracked)
- The buyer's wallet address or transaction history

### Selective disclosure in action:
```
Creator stores:  contentHash → public (anyone can verify)
                 content     → private (only creator has it)

Buyer receives:  content     → off-chain from creator
                 proof       → hash matches on-chain record
```

---

## Project Structure

```
nightsignals/
├── contracts/
│   └── nightsignals.compact    # Compact smart contract
├── src/
│   ├── deploy.ts               # Contract deployment script
│   ├── cli.ts                  # Interactive CLI
│   ├── setup.ts                # Full setup (wallet + deploy)
│   ├── wallet.ts               # Wallet creation and management
│   ├── wallet-state.ts         # Wallet state persistence
│   ├── network.ts              # Network configuration
│   └── check-balance.ts        # Balance checker
├── scripts/
│   └── e2e-check.ts            # End-to-end verification
├── .github/workflows/
│   └── ci.yml                  # CI/CD pipeline
└── README.md
```

---

## Setup

### Prerequisites

- Node.js >= 22
- Docker (for proof server)
- Compact compiler (`curl ... | sh` from [docs.midnight.network](https://docs.midnight.network))

### Quick Start

```bash
# Clone
git clone https://github.com/subheeksh5599/nightsignals
cd nightsignals

# Install
npm install

# Compile (requires Docker + proof server)
npm run compile

# Setup wallet, fund from faucet, deploy
npm run setup -- --network preprod

# Interactive CLI
npm run cli
```

### CI/CD Compilation

GitHub Actions compiles the contract on every push. Download the `nightsignals-managed` artifact from the Actions tab if you can't compile locally.

---

## Deployment

```bash
# Switch to preprod
npm run network preprod

# Setup (creates wallet, waits for faucet, deploys)
npm run setup -- --network preprod

# Deploy only (if already funded)
npm run deploy
```

### Networks

| Network | Faucet |
|---------|--------|
| `undeployed` | Local devnet (Docker) |
| `preview` | [Preview faucet](https://midnight-tmnight-preview.nethermind.dev) |
| `preprod` | [Preprod faucet](https://midnight-tmnight-preprod.nethermind.dev) |

---

## Tech Stack

- **Smart Contract**: [Compact](https://docs.midnight.network/compact) v0.23
- **Runtime**: [Midnight.js](https://docs.midnight.network/sdks/official/midnight-js) v4.1
- **Wallet SDK**: [@midnight-ntwrk/wallet-sdk](https://www.npmjs.com/package/@midnight-ntwrk/wallet-sdk) v1.2
- **Proof Server**: Docker-based, localhost:6300
- **CI/CD**: GitHub Actions

---

## Hackathon

Built for **New Moon to Full: Monthly Moonshots on Midnight** — Level 1 through Level 3.

See [Submission Checklist](#) for full requirements.

---

## License

MIT © 2026 Subheeksh
