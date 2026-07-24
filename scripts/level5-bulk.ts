/**
 * Level 5 — Generate 50 Midnight preprod wallets with on-chain activity.
 *
 * For each wallet:
 *   1. Generate a random seed
 *   2. Create wallet, derive bech32m address
 *   3. Fund from faucet (user does this manually or we script faucet calls)
 *   4. Create a signal or purchase one on the deployed nightsignals contract
 *   5. Record address + tx hash to a JSON file
 *
 * Usage: npx tsx scripts/level5-bulk.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { WebSocket } from 'ws';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  WalletFacade,
  HDWallet,
  Roles,
  createKeystore,
  NoOpTransactionHistoryStorage,
  PublicKey,
} from '@midnight-ntwrk/wallet-sdk';
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as Rx from 'rxjs';

// @ts-expect-error
globalThis.WebSocket = WebSocket;

// ─── Config ────────────────────────────────────────────────────────────────────

const NETWORK = 'preprod' as const;
const TOTAL_USERS = 50;
const FAUCET_URL = 'https://midnight-tmnight-preprod.nethermind.dev';
const OUTPUT_FILE = path.resolve(process.cwd(), 'level5-users.json');

const NETWORK_CONFIG = {
  networkId: NETWORK,
  indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  node: 'https://rpc.preprod.midnight.network',
  proofServer: 'http://127.0.0.1:6300',
  faucet: FAUCET_URL,
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UserRecord {
  index: number;
  seed: string;
  address: string;
  funded: boolean;
  txHash: string | null;
  action: 'createSignal' | 'purchaseSignal' | null;
  signalId: number | null;
  timestamp: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function deriveKeys(seed: string) {
  const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
  if (hdWallet.type !== 'seedOk') throw new Error('Invalid seed');
  const result = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (result.type !== 'keysDerived') throw new Error('Key derivation failed');
  hdWallet.hdWallet.clear();
  return result.keys;
}

async function createWalletCtx(seed: string) {
  setNetworkId(NETWORK);
  const keys = deriveKeys(seed);
  const networkId = getNetworkId();
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], networkId);

  const walletConfig = {
    networkId,
    indexerClientConnection: {
      indexerHttpUrl: NETWORK_CONFIG.indexer,
      indexerWsUrl: NETWORK_CONFIG.indexerWS,
    },
    provingServerUrl: new URL(NETWORK_CONFIG.proofServer),
    relayURL: new URL(NETWORK_CONFIG.node.replace(/^http/, 'ws')),
    txHistoryStorage: new NoOpTransactionHistoryStorage(),
    costParameters: { additionalFeeOverhead: 300_000_000_000_000n, feeBlocksMargin: 5 },
  };

  const wallet = await WalletFacade.init({
    configuration: walletConfig,
    shielded: async (config: any) => (await import('@midnight-ntwrk/wallet-sdk')).ShieldedWallet(config).startWithSecretKeys(shieldedSecretKeys),
    unshielded: async (config: any) => (await import('@midnight-ntwrk/wallet-sdk')).UnshieldedWallet(config).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: async (config: any) => (await import('@midnight-ntwrk/wallet-sdk')).DustWallet(config).startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust),
  });

  await wallet.start(shieldedSecretKeys, dustSecretKey);
  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
}

function unshieldedToken() {
  return ledger.unshieldedToken();
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║  Level 5 — Generate ${TOTAL_USERS} Preprod Users`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\n`);

  // Load existing records
  let records: UserRecord[] = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    records = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    console.log(`Loaded ${records.length} existing records from ${OUTPUT_FILE}`);
  }

  const startIndex = records.length;

  for (let i = startIndex; i < TOTAL_USERS; i++) {
    console.log(`\n─── User ${i + 1}/${TOTAL_USERS} ───`);

    // 1. Generate seed
    const seed = crypto.randomBytes(32).toString('hex');
    console.log(`  Seed: ${seed.slice(0, 16)}...`);

    // 2. Create wallet, get address
    const ctx = await createWalletCtx(seed);
    const address = ctx.unshieldedKeystore.getBech32Address().toString();
    console.log(`  Address: ${address}`);

    // 3. Record
    const record: UserRecord = {
      index: i,
      seed,
      address,
      funded: false,
      txHash: null,
      action: null,
      signalId: null,
      timestamp: new Date().toISOString(),
    };
    records.push(record);

    // Save after each wallet
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(records, null, 2));
    console.log(`  Saved to ${OUTPUT_FILE}`);

    await ctx.wallet.stop();
  }

  console.log(`\n✅ Generated ${TOTAL_USERS} wallet addresses`);
  console.log(`   Output: ${OUTPUT_FILE}`);
  console.log(`\nNext steps:`);
  console.log(`   1. Fund each address from faucet: ${FAUCET_URL}`);
  console.log(`   2. Run level5-transact.ts to perform on-chain actions`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
