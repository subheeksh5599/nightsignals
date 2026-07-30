/**
 * Level 5 — Create 50 signals with WebSocket keepalive patch.
 * 
 * Midnight preprod RPC closes idle WebSocket connections.
 * This script patches ws to auto-ping every 10s.
 */
import { WebSocket as WsNative } from 'ws';

// Monkey-patch: auto-ping every 10s to prevent RPC disconnects
const proto = (WsNative as any).prototype;
const origOn = proto.on;
proto.on = function(event: string, listener: any) {
  if (event === 'open') {
    const ws = this;
    const superListener = function(this: any, ...args: any[]) {
      const interval = setInterval(() => {
        if (ws.readyState === 1) try { ws.ping(); } catch(e) {}
        else clearInterval(interval);
      }, 10000);
      ws.on('close', () => clearInterval(interval));
      return listener.apply(this, args);
    };
    return origOn.call(this, event, superListener);
  }
  return origOn.call(this, event, listener);
};

// Set global WebSocket to our patched version
(globalThis as any).WebSocket = WsNative;

// Now the rest is the actual level5 logic
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { getOrCreateSeed } from '../src/network';
import { createWallet } from '../src/wallet';

const CONTRACT_ADDRESS = '5c35a52355dec9b34aa0e766c36f3588781a331fe7ebb801cf474ecdad80db3e';
const USERS_FILE = path.resolve(process.cwd(), 'level5-users.json');
const NETWORK = 'preprod';

const NETWORK_CONFIG = {
  networkId: NETWORK,
  indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  node: 'https://rpc.preprod.midnight.network',
  proofServer: 'http://127.0.0.1:6300',
};

interface UserEntry {
  index: number; firstName: string; lastName: string; email: string;
  seed: string; address: string; action: string; txHash: string | null;
}

async function main() {
  setNetworkId(NETWORK);
  const users: UserEntry[] = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  const pending = users.filter(u => !u.txHash || u.txHash === 'verified');

  if (pending.length === 0) {
    console.log('All users already processed.');
    process.exit(0);
  }

  console.log(`Creating signals for ${pending.length} users...\n`);

  const seed = getOrCreateSeed(NETWORK);
  const walletCtx = await createWallet({ network: NETWORK, networkConfig: NETWORK_CONFIG as any, seed });
  console.log('Wallet synced, connecting to contract...');
  
  await walletCtx.wallet.waitForSyncedState();
  console.log('Synced.');

  const zkConfigPath = path.resolve(process.cwd(), 'contracts', 'managed', 'nightsignals');
  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);

  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) });
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'ns-bulk',
      accountId: walletCtx.unshieldedKeystore.getBech32Address().toString(),
      privateStoragePasswordProvider: () => 'Local-Devnet-Development-Placeholder-1',
    }),
    publicDataProvider: indexerPublicDataProvider(NETWORK_CONFIG.indexer, NETWORK_CONFIG.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(NETWORK_CONFIG.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };

  const { Contract } = await import(pathToFileURL(path.join(zkConfigPath, 'contract', 'index.js')).href);
  const { CompiledContract } = await import('@midnight-ntwrk/midnight-js-protocol/compact-js');

  const compiledContract = CompiledContract.make('nightsignals', Contract).pipe(
    (self: any) => CompiledContract.withWitnesses(self, { localSecretKey: () => new Uint8Array(32) }),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );

  const deployed: any = await findDeployedContract(providers, {
    contractAddress: CONTRACT_ADDRESS,
    compiledContract: compiledContract as any,
    privateStateId: 'nsBulk',
    initialPrivateState: {},
  });

  console.log(`Connected to ${CONTRACT_ADDRESS}\n`);

  for (const user of pending) {
    try {
      const content = `Signl${String(user.index).padStart(4,'0')}${user.firstName.slice(0,4)}${user.lastName.slice(0,4)}`;
      const buf = new Uint8Array(32);
      new TextEncoder().encode(content).forEach((b, i) => { if (i < 32) buf[i] = b; });

      console.log(`User ${user.index}: ${user.firstName} ${user.lastName}...`);
      const result = await deployed.callTx.createSignal(10n, buf);
      const txHash = result?.txHash || result?.public?.txId || 'ok';
      user.txHash = String(txHash);
      user.action = 'createSignal';
      console.log(`  ✓ ${txHash}`);
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (err: any) {
      console.error(`  ✗ ${err.message?.slice(0, 80)}`);
    }
  }

  await walletCtx.wallet.stop();
  console.log(`\nDone. Updated ${USERS_FILE}`);
}

main().catch(e => { console.error(e); process.exit(1); });
