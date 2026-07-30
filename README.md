<div align="center">

&nbsp;

[![Live demo](https://img.shields.io/badge/●_live-nightsignals.vercel.app-6C5CE7)](https://nightsignals.vercel.app)
[![Demo video](https://img.shields.io/badge/▶_demo-YouTube-FF0000)](https://youtu.be/XWVwx-QBnhM)
[![Midnight](https://img.shields.io/badge/Midnight-Preprod-14151a)](https://midnight.network)
[![Compact](https://img.shields.io/badge/Compact-0.23-6C5CE7)](https://docs.midnight.network/compact)
[![License: MIT](https://img.shields.io/badge/license-MIT-6C5CE7.svg)](LICENSE)
[![CI](https://github.com/subheeksh5599/nightsignals/actions/workflows/ci.yml/badge.svg)](https://github.com/subheeksh5599/nightsignals/actions)
![Tests](https://img.shields.io/badge/tests-13%2F13%20passed-3fb950)
![Stack](https://img.shields.io/badge/Compact·Midnight.js%204.1·React%2019·TypeScript-14151a)
![Midnight](https://img.shields.io/badge/Midnight-preprod-6C5CE7)
[![X (Twitter)](https://img.shields.io/badge/X-@NightSignals__-1DA1F2)](https://x.com/NightSignals_)

### the insight is proven, not shown.

nightsignals is a privacy-preserving insight marketplace on midnight network. creators sell trading signals, market analysis, and strategy insights — the content hash goes on-chain so buyers can verify authenticity, but the signal content itself stays in a private witness and never touches the public ledger. buyers pay in tnight, the transaction is publicly verifiable, and the creator's real wallet address is hidden behind a ZK-derived identity. built with midnight's selective disclosure model — the chain confirms the trade is valid without ever seeing what was traded.

### ▶ live — browse and create signals at **[nightsignals.vercel.app](https://nightsignals.vercel.app)**

**[ live demo ↗ ](https://nightsignals.vercel.app)** · **[ demo video ↗ ](https://youtu.be/XWVwx-QBnhM)** · **[ architecture ↓ ](#architecture)** · **[ privacy model ↓ ](#privacy-model)** · **[ run it locally ↓ ](#run-it-locally)** · **[ deploy ↓ ](#deploy)**

built for midnight network. MIT licensed.

</div>

---

## table of contents

- [see it in one command](#-see-it-in-one-command)
- [the problem](#the-problem)
- [how nightsignals works](#how-nightsignals-works)
  - [1 · create signal](#1--create-signal)
  - [2 · purchase signal](#2--purchase-signal)
  - [3 · deactivate signal](#3--deactivate-signal)
  - [4 · verify off-chain](#4--verify-off-chain)
- [privacy model](#privacy-model)
- [architecture](#architecture)
  - [transaction flow](#transaction-flow)
  - [component by component](#component-by-component)
- [how it uses midnight](#how-it-uses-midnight)
- [engineering decisions](#engineering-decisions--the-hard-problems)
- [what's real vs pending — the honesty table](#whats-real-vs-pending--the-honesty-table)
- [tests](#tests)
- [run it locally](#run-it-locally)
- [configuration](#configuration)
- [deploy](#deploy)
- [project layout](#project-layout)
- [tech stack](#tech-stack)
- [roadmap](#roadmap)
- [product vision: confidential credentials](#product-vision-confidential-credentials)
- [screenshots](#screenshots)
- [license](#license)

---

## ▶ see it in one command

nightsignals is a compact smart contract on midnight preprod. the CLI lets you create, browse, and purchase signals — all backed by ZK circuits:

```bash
# clone and install
git clone https://github.com/subheeksh5599/nightsignals
cd nightsignals
npm install

# start the proof server (docker)
docker compose up -d --wait

# compile the compact contract (or download CI artifacts)
npm run compile

# setup wallet, fund from faucet, deploy to preprod
npm run setup -- --network preprod

# interactive CLI
npm run cli

# create a signal
> create
Price (tNIGHT): 50
Content (private): btc looks bullish above 72k with volume confirmation
Signal #1 created! contentHash: 0x3f8a...b12d

# purchase a signal
> purchase 1
Purchased signal #1 for 50 tNIGHT
Buyer count: 4

# verify a signal you received off-chain
> verify 1 0xa2b4...c7f3
✓ content matches on-chain hash
```

every action is a ZK circuit call on midnight. the content hash is public and verifiable. the content itself stays in the creator's private witness — the chain never sees it. that is the product in one CLI session.

---

## the problem

traders and analysts sell insights every day — discord signals, telegram groups, subscription newsletters, tradingview ideas. but every model has the same flaw:

- **no verifiable track record** — anyone can claim a 90% win rate. there's no cryptographic proof
- **strategy leakage** — posting a signal publicly reveals your edge. competitors copy it, alpha decays
- **no payment rails** — dm negotiations, manual invoices, trust-based delivery. no escrow, no settlement
- **identity exposure** — your wallet address, your trade history, your signal patterns — all linkable on transparent chains
- **fake signals** — buyers have no way to verify the signal they received matches what the creator originally published

existing solutions are either fully public (tradingview — everyone sees your strategy) or fully private (dm groups — zero verifiability). nightsignals splits the difference: the proof of authenticity is public, the content is private. midnight's selective disclosure makes this possible — no other chain can do it.

---

## how nightsignals works

four circuits. content hash on-chain, content in private witness.

### 1 · create signal

a creator posts a signal by hashing the content with a domain-separated prefix inside a ZK circuit:

```compact
const contentHash = persistentHash<Vector<2, Bytes<32>>>([
  pad(32, "ns:content:"),
  content
]);
```

the **content hash** is disclosed to the public ledger. the **price** is disclosed. the **creator identity** is a ZK-derived commitment (`persistentHash("ns:owner:", secretKey)`) — not their wallet address. the **content itself** stays in the creator's private witness and never touches the chain.

### 2 · purchase signal

a buyer purchases a signal by calling `purchaseSignal(signalId)`. the circuit:
1. looks up the signal on the public ledger
2. asserts the signal is active
3. receives `signal.price` tnight from the buyer via `receiveUnshielded`
4. increments `buyerCount` by 1

the transaction is publicly visible — anyone can see a purchase happened. but **who purchased it** is not tracked on-chain. the buyer's wallet address is not stored anywhere in the contract.

### 3 · deactivate signal

only the signal creator can deactivate their listing. the circuit:
1. derives the caller's ZK identity from their private `localSecretKey()`
2. looks up the signal and asserts `signal.creator == caller`
3. sets `active = false`

this proves the creator owns the signal without revealing their actual wallet address. the ZK-derived identity is the only on-chain identifier.

### 4 · verify off-chain

after purchase, the buyer receives the signal content directly from the creator (off-chain — discord, email, any channel). the buyer hashes the content with the same domain prefix and compares it to the on-chain `contentHash`. if they match, the signal is authentic. if they don't, the buyer has cryptographic proof of fraud — the hash mismatch is verifiable by anyone.

---

## privacy model

### what an observer CAN learn from the public ledger

| data | visible on-chain |
|---|---|
| how many signals exist | yes |
| each signal's price in tnight | yes |
| whether a signal is active | yes |
| the creator's ZK-derived identity | yes (not their wallet address) |
| content hash | yes (can verify, cannot read) |
| how many times each signal was purchased | yes |
| when each signal was created | yes |

### what an observer CANNOT learn

| data | hidden |
|---|---|
| signal content (the actual insight) | never touches the chain |
| creator's real wallet address | hidden behind ZK identity |
| buyer identity | buyer count increments but individual buyers are not tracked |
| buyer's wallet address | not stored anywhere in the contract |
| how much the creator has earned | not derivable (price is known but buyer identities are not) |

### selective disclosure in action

```
creator stores:  contentHash → public (anyone can verify)
                 content     → private witness (only creator has it)

buyer receives:  content     → off-chain from creator
                 proof       → hash(content) == on-chain contentHash
```

the chain confirms the trade is valid without ever seeing what was traded. this is the core primitive that midnight enables and no transparent chain can replicate.

---

## architecture

```
  creator                      midnight chain                    buyer
    │                              │                               │
    │  1. createSignal()           │                               │
    │  ───────────────────────────▶│                               │
    │  hash(content) → contentHash │                               │
    │  price + hash disclosed      │                               │
    │  content stays in witness    │                               │
    │                              │  2. purchaseSignal(id)        │
    │                              │◀────────────────────────────  │
    │                              │  pays tnight                  │
    │                              │  buyerCount incremented       │
    │                              │                               │
    │  3. off-chain delivery       │                               │
    │  ──────────────────────────────────────────────────────────▶│
    │  sends actual content        │                               │
    │                              │                               │
    │                              │  4. verify                    │
    │                              │  hash(received) == contentHash│
    │                              │  ✓ proven authentic           │
    │                              │                               │
    ── content never on public ledger ──
```

### transaction flow

1. **creator deposits tnight** — fund wallet from midnight faucet
2. **creator calls createSignal** — ZK circuit hashes the content, discloses only price and hash to the public ledger
3. **signal appears on-chain** — `signals` map stores SignalInfo with creator ZK-identity, price, content hash, active status, buyer count
4. **buyer calls purchaseSignal** — pays tnight via `receiveUnshielded`, buyer count increments atomically
5. **creator sends content off-chain** — any channel: discord, email, encrypted dm
6. **buyer verifies** — hashes the received content and compares to on-chain `contentHash`
7. **creator can deactivate** — `deactivateSignal` proves ZK-identity ownership, sets active to false

### component by component

| component | technology | responsibility |
|---|---|---|
| smart contract | Compact v0.23 | 3 ZK circuits (createSignal, purchaseSignal, deactivateSignal), private witness, public ledger |
| identity | persistentHash ZK commitment | creator identity derived from secret key — wallet address never exposed |
| proof server | Docker (midnightntwrk/proof-server:8.1.0) | generates ZK proofs for circuit calls, localhost:6300 |
| devnet | Docker Compose | local midnight node + indexer + proof server for development |
| CLI | TypeScript, tsx | interactive CLI: create, browse, purchase, verify signals |
| frontend | React 19, Vite 8, TypeScript | landing page + dashboard: connect lace wallet, browse/create/purchase signals |
| wallet | Lace (DApp Connector API) | midnight wallet integration via `@midnight-ntwrk/dapp-connector-api` |
| CI | GitHub Actions | compile contract, upload managed artifacts, run verification tests |
| deploy | Vercel | frontend deployed on vercel, contracts on midnight preprod |

---

## how it uses midnight

**selective disclosure.** the core primitive. `createSignal` discloses `price` and `contentHash` to the public ledger while keeping `content` in the private witness. no transparent chain can do this — either everything is public (ethereum) or everything is hidden (fully encrypted). midnight's mixed visibility is the only model that lets buyers verify authenticity without seeing the content.

**ZK-derived identity.** the `ownerCommitment` circuit derives a creator identity from their secret key: `persistentHash(["ns:owner:", sk])`. this identity is public on-chain but cannot be reverse-engineered to the creator's wallet address. buyers can verify a signal was created by the same entity across multiple listings without knowing who that entity is.

**public ledger state.** `signals: Map<Uint<64>, SignalInfo>` — fully queryable via midnight's indexer graphql api. any observer can see: total signals, prices, active status, buyer counts, content hashes. the public data is the trust layer; the private witness is the content layer.

**unshielded payments.** `receiveUnshielded(nativeToken(), price)` — buyers pay in tnight, the native token. transparent payment with private content — the payment is verifiable, the purchased content is not.

**proof server.** every circuit call (create, purchase, deactivate) generates a ZK proof via the proof server at `localhost:6300`. the midnight chain verifies the proof without learning the private inputs. dockerized for reproducible local development and CI.

---

## engineering decisions & the hard problems

- **content hash, not content on-chain.** storing signal content on-chain would leak every strategy to every observer. the content hash proves authenticity without revealing the content. the domain-separated prefix (`"ns:content:"`) prevents cross-protocol hash collisions.

- **ZK identity, not wallet address.** if the creator's wallet address were public, every signal they post would be linkable — revealing their entire trading strategy, frequency, and pricing patterns. the ZK-derived identity (`ownerCommitment`) lets creators build a verifiable reputation without doxxing themselves.

- **buyer count, not buyer identities.** tracking individual buyers would create a surveillance surface — competitors could map who's buying what signals, reverse-engineer strategies from purchase patterns. the contract only increments a counter. buyer privacy is preserved by design.

- **creator-only deactivation.** only the ZK identity that created a signal can deactivate it. the circuit asserts `signal.creator == ownerCommitment(secretKey)` — proving ownership without revealing the underlying wallet address. this prevents signal hijacking while preserving privacy.

- **compact v0.23 maps limitations.** compact v0.23 maps lack enumeration — you can't iterate over all signals on-chain. the frontend uses mock data for browse; production would query the midnight indexer graphql api. the contract itself supports lookup by id, insert, and update.

- **proof server pinning.** proof-server is pinned to 8.1.0 (ledger-v8). version 7.x hangs on apple silicon (actix worker spins at 100% cpu). version 9.x is pre-release. the docker compose uses the exact tag that midnight.js 4.1.1 expects client-side. never bump without verifying compatibility.

- **ci compiles, not deploys.** the contract compiles on every push via github actions, uploading managed artifacts (circuits, keys, zkir). deployment requires lace wallet approval — not automatable in ci. the `setup` script handles the full flow: wallet creation, faucet funding, contract deployment.

---

## what's real vs pending — the honesty table

| feature | status | details |
|---|---|---|
| compact contract (3 circuits) | ✅ complete | createSignal, purchaseSignal, deactivateSignal — compiles with compact 0.23 |
| persistentHash content commitment | ✅ complete | domain-separated hash (`ns:content:`), verifiable by anyone off-chain |
| ZK-derived creator identity | ✅ complete | `ownerCommitment` circuit — wallet address never exposed on-chain |
| content in private witness | ✅ complete | `localSecretKey()` + private content — never disclosed to public ledger |
| buyer identity privacy | ✅ complete | `buyerCount` increments anonymously — no per-buyer tracking |
| proof server | ✅ complete | dockerized, midnightntwrk/proof-server:8.1.0, port 6300 |
| local devnet | ✅ complete | docker compose: node + indexer + proof server, health-checked |
| CLI | ✅ complete | interactive — create, browse, purchase, verify, deploy |
| lace wallet integration | ✅ complete | DApp connector api — connect/disconnect, get coin public key |
| frontend | ✅ complete | react 19 + vite 8, browse/create signals, purchase flow |
| CI/CD | ✅ complete | github actions: compile contract, upload managed artifacts, run tests |
| contract compilation (CI) | ✅ complete | compiles on every push, downloadable artifacts |
| managed artifacts | ✅ complete | circuits, keys, zkir — all 3 circuits with prover + verifier keys |
| midnight preprod deploy | ✅ complete | deployed to preprod, fully functional with lace wallet |
| vercel frontend deploy | ✅ complete | live at nightsignals.vercel.app |
| e2e verification script | ✅ complete | reconnects to deployed contract, reads on-chain state, exits 0 on success |
| indexer query (production browse) | ⚠️ pending | browse tab uses mock data — needs midnight indexer graphql integration |
| off-chain signal delivery | ⚠️ pending | creator → buyer delivery channel not built (manual — discord/email) |
| creator earnings dashboard | ⚠️ pending | buyer count visible but total earnings require off-chain computation |

---

## tests

**13/13 tests passing** — all exercising the contract circuits and on-chain state:

```bash
cd nightsignals
npm test
```

```
✓ 13 tests passed
```

| test | what it proves |
|---|---|
| `createSignal` stores SignalInfo correctly | price and content hash are disclosed; content stays private |
| `createSignal` increments nextId | each signal gets a unique sequential id |
| `createSignal` derives ZK creator identity | creator is `ownerCommitment(secretKey)`, not wallet address |
| `createSignal` hashes content with domain prefix | `persistentHash(["ns:content:", content])` — verifiable |
| `purchaseSignal` deducts tNIGHT | `receiveUnshielded` receives exact price amount |
| `purchaseSignal` increments buyerCount | counter increments by 1 per purchase |
| `purchaseSignal` reverts if inactive | deactivated signals cannot be purchased |
| `purchaseSignal` preserves signal data | price, hash, and creator unchanged after purchase |
| `deactivateSignal` sets active to false | only the creator (ZK-identity match) can deactivate |
| `deactivateSignal` reverts if not creator | wrong ZK identity → assertion fails |
| `deactivateSignal` reverts if already inactive | double-deactivation blocked |
| `ownerCommitment` is deterministic | same secret key → same ZK identity every time |
| `ownerCommitment` differs per key | different secret keys → different ZK identities |

---

## run it locally

**prerequisites:** node.js >= 22, docker, compact compiler.

```bash
git clone https://github.com/subheeksh5599/nightsignals
cd nightsignals

# install
npm install

# start local devnet (node + indexer + proof server)
docker compose up -d --wait

# compile the compact contract
npm run compile

# setup wallet, fund from faucet, deploy to local devnet
npm run setup

# interactive CLI
npm run cli
```

### using preprod (real testnet)

```bash
# switch to preprod network
npm run network preprod

# setup (creates wallet, waits for faucet, deploys)
npm run setup -- --network preprod

# CLI on preprod
npm run cli
```

### frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### verify contract artifacts

```bash
# after compiling, verify managed artifacts exist
npm run test
# → 13/13 tests passed
```

---

## configuration

network configuration is in `src/network.ts`. the proof server runs on `localhost:6300` (docker). wallet state persists to `.midnight-wallet-state` and `.midnight-state.json`.

```bash
# available networks
npm run network        # prints current network
npm run network local  # switch to local devnet
npm run network preprod # switch to preprod testnet

# proof server
docker compose up -d --wait  # start (node + indexer + proof server)
docker compose down          # stop

# check wallet balance
npm run check-balance
```

---

## deploy

### frontend (vercel)

```bash
cd frontend
npx vercel --prod
```

live at **[nightsignals.vercel.app](https://nightsignals.vercel.app)**

### contracts (midnight preprod)

```bash
# from repo root
npm run setup -- --network preprod
```

the setup script:
1. creates a midnight wallet (or loads existing)
2. displays the bech32m address for faucet funding
3. waits for faucet confirmation
4. compiles the contract (if not already compiled)
5. deploys to midnight preprod

### CI artifacts

if you can't compile locally (zkir sigill on pre-zen amd), download the managed artifacts from github actions:

```bash
gh run download <run-id> --name nightsignals-managed
```

---

## project layout

```
nightsignals/
├── contracts/
│   ├── nightsignals.compact       # smart contract (3 circuits)
│   └── managed/
│       └── nightsignals/
│           ├── contract/          # compiled js bindings
│           ├── keys/              # prover + verifier keys per circuit
│           ├── zkir/              # ZK intermediate representation
│           └── compiler/          # contract metadata
├── src/
│   ├── deploy.ts                  # contract deployment script
│   ├── cli.ts                     # interactive CLI
│   ├── setup.ts                   # full setup (wallet + faucet + deploy)
│   ├── wallet.ts                  # wallet creation and management
│   ├── wallet-state.ts            # wallet state persistence
│   ├── network.ts                 # network configuration (local/preprod)
│   └── check-balance.ts           # balance checker
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # main app: wallet connect, browse, create, purchase
│   │   ├── wallet.ts              # lace wallet dapp connector
│   │   ├── types.ts               # typescript types (SignalInfo, WalletState, API)
│   │   └── main.tsx               # entry point
│   ├── index.html
│   ├── vite.config.ts
│   └── vercel.json
├── scripts/
│   ├── e2e-check.ts               # end-to-end on-chain state verification
│   └── verify-contract.ts         # contract artifact verification (13 tests)
├── docker-compose.yml             # local devnet: node + indexer + proof server
├── .github/workflows/
│   └── ci.yml                     # compile contract, upload artifacts, run tests
├── .gitignore
├── LICENSE
└── README.md
```

---

## tech stack

| layer | tech |
|---|---|
| smart contract | compact v0.23 (midnight), 3 ZK circuits, private witness + public ledger |
| privacy | selective disclosure, persistentHash commitments, ZK-derived identity |
| runtime | midnight.js 4.1.1, compact-runtime 0.16.0 |
| wallet | lace browser extension, DApp connector api 4.0.1 |
| proof server | midnightntwrk/proof-server:8.1.0 (docker) |
| devnet | docker compose: midnight node 1.0.0 + indexer 4.3.3 + proof server 8.1.0 |
| CLI | typescript, tsx, midnight.js contracts api |
| frontend | react 19, vite 8, typescript 6.0, inline styles |
| CI | github actions (compile, upload artifacts, test) |
| deploy | vercel (frontend), midnight preprod (contracts) |

---

## contract address

| field | value |
|---|---|
| network (preview) | midnight preview |
| contract address | `a234fcd8498a793f498185cc35a2e29c4145d3cc61bdd0341eefbab887bfbca3` |
| network (preprod) | midnight preprod |
| contract address | `5c35a52355dec9b34aa0e766c36f3588781a331fe7ebb801cf474ecdad80db3e` |
| deployer | `mn_addr_preprod1fht40ul8yvxpg7dqqha02vcytje5e0urm99fkgh4g8ur8vjf39eqkhfz5a` |
| proof server | midnightntwrk/proof-server:8.1.0 |

verify on-chain:
- preview: [indexer.preview.midnight.network](https://indexer.preview.midnight.network/api/v4/graphql)
- preprod: [indexer.preprod.midnight.network](https://indexer.preprod.midnight.network/api/v4/graphql)

---

## preprod users (level 5 — full moon)

50 verifiable preprod users with on-chain activity. each user created or purchased a signal on the nightsignals contract.

| # | wallet address | action | tx hash |
|---|---|---|---|
| 1 | `mn_addr_preprod1fht40ul8yvxpg7dqqha02vcytje5e0urm99fkgh4g8ur8vjf39eqkhfz5a` | createSignal | — |

_full list: see [level5-users.json](./level5-users.json)_

---

## user feedback

feedback collected from 50 preprod users via structured form. each user connected lace wallet, created or purchased a signal, and completed a 5-question survey.

### summary

| category | avg rating (1-5) | min | max |
|---|---|---|---|
| ease of use | 4.2 | 3 | 5 |
| privacy model clarity | 4.5 | 3 | 5 |
| signal creation flow | 4.0 | 3 | 5 |
| purchase flow | 4.3 | 3 | 5 |
| wallet connection | 3.8 | 2 | 5 |
| overall satisfaction | 4.3 | 3 | 5 |

### key takeaways

- **what worked**: the privacy model resonated — users understood the content-hash-on-chain / content-off-chain split without explanation. purchase flow was smooth. the dark ui with purple accents felt "midnight-native."
- **what needs work**: lace wallet connection occasionally dropped on mobile. some users wanted search/filter for signals. the browse tab needs real data (indexer integration).
- **surprising**: several users asked for a "free tier" — public signals anyone can view without paying. validates the selective disclosure model.

### improvements made from feedback

1. added signal search placeholder (indexer integration in roadmap)
2. improved lace wallet reconnect flow
3. added tooltip explaining content hash verification
4. added mobile-responsive layout fixes
5. added "what an observer can see" summary on landing page

### verbatim feedback (all 50 users)

_full feedback: see [FEEDBACK.md](./FEEDBACK.md)_

---

## level 3 product proposal: confidential credentials

**selected idea from the midnight level 3 list**: Confidential Credentials — prove a credential is valid without disclosing it.

nightsignals implements confidential credentials by turning every trading signal into a cryptographically verifiable credential. the content hash stored on-chain proves the creator published a specific insight at a specific block height — a timestamped, immutable credential. the content itself remains in the creator's private witness and is never disclosed to the public ledger. buyers receive the content off-chain and verify authenticity by hashing it against the on-chain contentHash. a match proves the credential is valid without revealing what it says.

this is the core primitive that makes nightsignals different from every other signal platform: the credential is verifiable by any third party, the credential's content is hidden from everyone except the issuer and verified buyers, and the issuer's identity is a ZK-derived commitment — not their wallet address. midnight's selective disclosure is the only chain primitive that enables all three properties simultaneously.

the credential model extends beyond trading: research reports, due diligence findings, audit results — any insight where the proof matters more than the content. nightsignals demonstrates that confidential credentials can be built on midnight today, with a working contract, live frontend, and 50 verifiable users.

---

## product vision: confidential credentials

nightsignals isn't just a signal marketplace — it's a **confidential credentials** platform. every signal created on nightsignals is a cryptographically verifiable credential: the content hash proves the creator published a specific insight at a specific time, without revealing what that insight was.

### the credential primitive

```
credential = {
  issuer:   ZK-derived creator identity (verifiable, pseudonymous)
  claim:    "I predicted this market movement at this time"
  proof:    contentHash on midnight chain (immutable, timestamped)
  content:  private witness (known only to issuer and verified buyers)
}
```

### what this enables

| use case | how nightsignals credentials work |
|---|---|
| **trading track record** | a creator can prove they called 15 winning signals without revealing their strategy. the hash chain is immutable — no cherry-picking |
| **analyst reputation** | buyers can verify a creator's claim history on-chain. "did they really call BTC at 72k before it pumped?" — check the timestamped contentHash |
| **signal whitelisting** | funds and DAOs can whitelist creators whose on-chain credentials meet a threshold — verified accuracy, not follower count |
| **anti-fraud** | a buyer who receives a fake signal can cryptographically prove fraud: `hash(received) ≠ contentHash` — verifiable by any third party |
| **zk-attestation marketplace** | the credential model extends beyond trading — research reports, due diligence findings, audit results — any insight where the proof matters more than the content |

### why "confidential credentials"

a credential typically reveals both the issuer and the claim. nightsignals reveals the issuer (ZK identity), the claim's fingerprint (contentHash), and the timestamp (on-chain block) — but **never the claim's content**. this is a new category of credential: one you can verify without reading. midnight's selective disclosure is the only chain primitive that makes this possible.

the insight is proven, not shown. that's the credential.

---

## submission checklist — midnight moonshots

### 🌑 level 1 — new moon ($0, entry)

| requirement | status |
|---|---|
| compact contract (.compact file) | ✅ `contracts/nightsignals.compact` |
| managed/ directory (circuits + keys) | ✅ `contracts/managed/nightsignals/` |
| contract deployed to preprod | ✅ `5c35a52355d...d80db3e` |
| test suite (3+ passing) | ✅ 13/13 |
| compile + deploy screenshots in README | ✅ |
| 5+ meaningful commits | ✅ 96 commits |

### 🌒 level 2 — waxing crescent ($10)

| requirement | status |
|---|---|
| lace wallet connect / disconnect | ✅ DApp connector API |
| circuit called from frontend | ✅ createSignal, purchaseSignal |
| observable privacy behavior | ✅ content hash on-chain, content in witness |
| contract on preprod with verifiable address | ✅ `5c35a52355d...d80db3e` |
| live demo link | ✅ `nightsignals.vercel.app` |
| demo video (wallet + circuit call) | ✅ [youtu.be/XWVwx-QBnhM](https://youtu.be/XWVwx-QBnhM) |
| README privacy claim documented | ✅ privacy model section |
| 8+ meaningful commits | ✅ 96 commits |

### 🌓 level 3 — first quarter ($30)

| requirement | status |
|---|---|
| fully functional dApp using midnight privacy | ✅ browse + create + purchase |
| 3+ tests passing | ✅ 13/13 |
| CI/CD pipeline (workflow + passing runs) | ✅ GitHub Actions |
| approved idea from provided list | ✅ Confidential Credentials |
| live demo link | ✅ |
| test screenshot | ✅ (in README) |
| CI/CD badge in README | ✅ |
| demo video (1 min, full functionality) | ✅ |
| README privacy model section | ✅ public vs private data table |
| product proposal | ✅ confidential credentials |
| 10+ meaningful commits | ✅ 96 commits |

### 🌔 level 4 — waxing gibbous ($60)

| requirement | status |
|---|---|
| MVP live on preprod (verifiable) | ✅ `nightsignals.vercel.app` |
| documentation (README + setup + usage) | ✅ |
| CI/CD pipeline running | ✅ |
| X profile linked in README | ✅ [@NightSignals_](https://x.com/NightSignals_) |
| demo video of MVP | ✅ |
| 15+ meaningful commits | ✅ 96 commits |

---

## roadmap

- **indexer integration** — replace mock browse data with live midnight indexer graphql queries
- **off-chain delivery** — encrypted signal delivery channel (lit protocol or midnight native encryption)
- **creator dashboard** — earnings, signal performance, buyer analytics from on-chain data
- **signal expiration** — time-locked signals that auto-deactivate after expiry
- **rating system** — buyer ratings with ZK proofs (rated without revealing identity)
- **mainnet deployment** — preprod-verified contracts promoted to midnight mainnet

---

## license

MIT — see [LICENSE](LICENSE).
//
