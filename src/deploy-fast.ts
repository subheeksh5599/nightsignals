
/**
 * Minimal deploy — skips waitForSyncedState.
 * The wallet starts syncing in the background. We just need the coin public key
 * and encryption public key (available immediately from the seed), plus
 * balanceTx/submitTx which use the wallet facade (works with partial state).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolveNetwork, getOrCreateSeed, recordDeployment } from './network';
import { createWallet, persistWalletState, unshieldedToken, type WalletContext } from './wallet';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import * as Rx from 'rxjs';

import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

globalThis.WebSocket = WebSocket;

const PRIVATE_STATE_ID = 'nightsignalsPrivateState';

const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);

// Compiled contract
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'nightsignals');
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');

if (!fs.existsSync(contractPath)) {
  console.error('Contract not compiled! Run: npm run compile');
  process.exit(1);
}

const NightSignals = await import(pathToFileURL(contractPath).href);

const compiledContract = CompiledContract.make('nightsignals', NightSignals.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

async function createProviders(walletCtx: WalletContext) {
  const privateStatePassword = process.env.PRIVATE_STATE_PASSWORD?.trim() || 'Local-Devnet-Development-Placeholder-1';

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

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'nightsignals-state',
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

async function waitForProofServer(maxAttempts = 60, delayMs = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fetch(networkConfig.proofServer, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return true;
    } catch (err: any) {
      const code = err?.cause?.code || err?.code || '';
      if (code !== 'ECONNREFUSED' && code !== 'UND_ERR_CONNECT_TIMEOUT' && code !== 'UND_ERR_SOCKET') {
        return true;
      }
    }
    if (attempt < maxAttempts) {
      process.stdout.write(`\r  Waiting for proof server... (${attempt}/${maxAttempts})   `);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}

async function main() {
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  Deploy nightsignals to ${network} (fast mode)`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);

  console.log('─── Wallet setup ─────────────────────────────────\n');
  console.log('  Creating wallet...');
  const walletCtx = await createWallet({ network, networkConfig, seed: SEED });
  
  const address = walletCtx.unshieldedKeystore.getBech32Address();
  console.log(`  Wallet Address: ${address}`);
  
  // Skip waitForSyncedState — try getting state from observable directly
  console.log('  Waiting for initial state (10s max)...');
  try {
    const state = await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.timeout({ first: 10000, with: () => { throw new Error('timeout'); } })
      )
    );
    const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
    console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);
    
    if (network !== 'undeployed' && balance === 0n) {
      console.log('  Wallet has no funds. Fund it first, then re-run.');
      console.log(`  Faucet: ${networkConfig.faucet}`);
      await walletCtx.wallet.stop();
      process.exit(1);
    }
  } catch {
    console.log('  Could not get synced state, attempting deploy anyway...\n');
  }

  // Try deploy
  console.log('─── Deploy Contract ──────────────────────────────\n');
  
  const proofServerReady = await waitForProofServer();
  if (!proofServerReady) {
    console.log('  Proof server not responding.');
    await walletCtx.wallet.stop();
    process.exit(1);
  }
  console.log('  Proof server ready!');

  console.log('  Setting up providers...');
  const providers = await createProviders(walletCtx);

  console.log('  Deploying contract...\n');

  const MAX_RETRIES = 20;
  const RETRY_DELAY_MS = 5000;
  let deployed;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      deployed = await deployContract(providers, {
        compiledContract: compiledContract as any,
        args: [],
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: {},
      });
      break;
    } catch (err: any) {
      const errMsg = err?.message || err?.toString() || '';
      console.error(`  Attempt ${attempt} error: ${errMsg}`);
      
      if (errMsg.includes('Not enough Dust') || errMsg.includes('Insufficient Funds')) {
        if (attempt < MAX_RETRIES) {
          console.log(`  DUST shortage, retrying in ${RETRY_DELAY_MS / 1000}s...`);
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        } else {
          console.log('  Not enough DUST after all retries');
          await walletCtx.wallet.stop();
          process.exit(1);
        }
      } else if (errMsg.includes('Proof Server') || errMsg.includes('ECONNREFUSED')) {
        console.log('  Proof server unreachable');
        await walletCtx.wallet.stop();
        process.exit(1);
      } else {
        throw err;
      }
    }
  }

  if (!deployed) throw new Error('Deployment failed');

  const contractAddress = deployed.deployTxData.public.contractAddress;
  console.log(`  ✅ Contract deployed!`);
  console.log(`  Contract Address: ${contractAddress}\n`);

  recordDeployment(network, contractAddress, address.toString());
  console.log('  Saved to .midnight-state.json\n');

  await persistWalletState(network, walletCtx);
  await walletCtx.wallet.stop();
  console.log('─── Done ──────────────────────────────────────────\n');
  console.log(`  Contract: ${contractAddress}`);
  console.log(`  Network:  ${network}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
