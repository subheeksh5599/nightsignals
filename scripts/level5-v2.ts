/**
 * Create 50 signals on the ALREADY DEPLOYED preprod contract.
 * Uses the same contract connection pattern as the deploy script (which works).
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
import { createWallet } from '../src/wallet';

globalThis.WebSocket = WebSocket;

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
  const users: UserEntry[] = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  const pending = users.filter(u => !u.txHash || u.txHash === 'verified');

  console.log(`Creating signals for ${pending.length} users...\n`);

  const seed = getOrCreateSeed(NETWORK);
  const walletCtx = await createWallet({ network: NETWORK, networkConfig: NETWORK_CONFIG as any, seed });
  await walletCtx.wallet.waitForSyncedState();
  console.log('Wallet synced.');

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
  console.log(`\nDone.`);
}

main().catch(e => { console.error(e); process.exit(1); });
