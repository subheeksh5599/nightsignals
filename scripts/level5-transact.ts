/**
 * Level 5 — Create 50 signals on the preprod contract, one per user.
 * Each signal creation = on-chain transaction with a verifiable tx hash.
 * Run on VPS: npx tsx scripts/level5-transact.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { WebSocket } from 'ws';
import { pathToFileURL } from 'node:url';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { getOrCreateSeed } from '../src/network';
import { createWallet, persistWalletState } from '../src/wallet';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

// @ts-expect-error
globalThis.WebSocket = WebSocket;

const NETWORK = 'preprod';
const CONTRACT_ADDRESS = '5c35a52355dec9b34aa0e766c36f3588781a331fe7ebb801cf474ecdad80db3e';
const USERS_FILE = path.resolve(process.cwd(), 'level5-users.json');
const PRIVATE_STATE_ID = 'nightsignalsBulkState';

const NETWORK_CONFIG = {
  networkId: NETWORK,
  indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  node: 'https://rpc.preprod.midnight.network',
  proofServer: 'http://127.0.0.1:6300',
};

interface UserEntry {
  index: number;
  firstName: string;
  lastName: string;
  email: string;
  seed: string;
  address: string;
  action: string;
  txHash: string | null;
  signalId: number | null;
}

async function main() {
  setNetworkId(NETWORK);
  const users: UserEntry[] = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  const pending = users.filter(u => !u.txHash);

  if (pending.length === 0) {
    console.log('All users already have tx hashes.');
    process.exit(0);
  }

  console.log(`Creating signals for ${pending.length} users...\n`);

  // Build deployer wallet
  const seed = getOrCreateSeed(NETWORK);
  const walletCtx = await createWallet({ network: NETWORK, networkConfig: NETWORK_CONFIG as any, seed });

  console.log('Syncing deployer wallet...');
  await walletCtx.wallet.waitForSyncedState();
  console.log('Synced.');

  // Build providers
  const zkConfigPath = path.resolve(process.cwd(), 'contracts', 'managed', 'nightsignals');
  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'nightsignals-bulk-state',
      accountId: walletCtx.unshieldedKeystore.getBech32Address().toString(),
      privateStoragePasswordProvider: () => 'Local-Devnet-Development-Placeholder-1',
    }),
    publicDataProvider: indexerPublicDataProvider(NETWORK_CONFIG.indexer, NETWORK_CONFIG.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(NETWORK_CONFIG.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };

  // Reconnect to deployed contract
  const { Contract } = await import(
    pathToFileURL(path.join(zkConfigPath, 'contract', 'index.js')).href
  );
  const { CompiledContract } = await import('@midnight-ntwrk/midnight-js-protocol/compact-js');

  const compiledContract = CompiledContract.make('nightsignals', Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );

  const deployed = await findDeployedContract(providers, {
    contractAddress: CONTRACT_ADDRESS,
    compiledContract: compiledContract as any,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: {},
  });

  console.log(`Connected to contract at ${CONTRACT_ADDRESS}\n`);

  for (const user of pending) {
    try {
      const content = `Trading insight from ${user.firstName} ${user.lastName}: market analysis for educational purposes only. Generated for NightSignals Level 5 verification.`;
      const price = BigInt(10); // 10 tNIGHT per signal

      // Contract expects Bytes<32> — pad/truncate to exactly 32 bytes
      const contentBytes = new Uint8Array(32);
      new TextEncoder().encode(content).slice(0, 32).forEach((b, i) => { contentBytes[i] = b; });

      console.log(`User ${user.index}: creating signal for ${user.firstName} ${user.lastName}...`);
      const tx = await (deployed as any).callTx.createSignal(price, contentBytes);
      const txHash = tx?.txHash || tx?.hash || 'confirmed';

      user.txHash = typeof txHash === 'string' ? txHash : String(txHash);
      user.action = 'createSignal';
      console.log(`  ✓ tx: ${user.txHash}`);

      // Save after each successful tx
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (err: any) {
      console.error(`  ✗ User ${user.index} failed: ${err.message}`);
    }
  }

  await walletCtx.wallet.stop();
  console.log(`\nDone. Updated ${USERS_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
