/**
 * Derive and print the bech32m wallet address from the stored seed.
 */
import { WebSocket } from 'ws';
import { resolveNetwork, getOrCreateSeed } from '../src/network';
import { createWallet } from '../src/wallet';

// @ts-expect-error
globalThis.WebSocket = WebSocket;

const { network, config: networkConfig } = resolveNetwork();
const seed = getOrCreateSeed(network);

const walletCtx = await createWallet({ network, networkConfig, seed });
const address = walletCtx.unshieldedKeystore.getBech32Address().toString();

console.log(`network:  ${network}`);
console.log(`address:  ${address}`);

await walletCtx.wallet.stop();
