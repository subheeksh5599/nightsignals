/**
 * Sync wallet and persist state. Run this first, then deploy separately.
 */
import { WebSocket } from 'ws';
import { resolveNetwork, getOrCreateSeed } from '../src/network';
import { createWallet, persistWalletState } from '../src/wallet';

// @ts-expect-error
globalThis.WebSocket = WebSocket;

const { network, config: networkConfig } = resolveNetwork();
const seed = getOrCreateSeed(network);

console.log(`Syncing wallet on ${network}...`);
const walletCtx = await createWallet({ network, networkConfig, seed });

console.log('Waiting for synced state (this may take a while)...');
const syncStart = Date.now();
const syncInterval = setInterval(() => {
  const elapsed = Math.round((Date.now() - syncStart) / 1000);
  process.stdout.write(`\r  Syncing... (${elapsed}s elapsed)   `);
}, 5000);

const state = await walletCtx.wallet.waitForSyncedState();
clearInterval(syncInterval);
process.stdout.write('\r  Synced!                                          \n');

const address = walletCtx.unshieldedKeystore.getBech32Address();
const balance = state.unshielded.balances[Object.keys(state.unshielded.balances)[0]] ?? 0n;
console.log(`Address: ${address}`);
console.log(`Balance: ${balance.toLocaleString()} tNight`);

console.log('Persisting wallet state...');
await persistWalletState(network, walletCtx);
console.log('Done! Wallet state saved. You can now deploy.');

await walletCtx.wallet.stop();
