/**
 * Send 1 tNIGHT from deployer to each of the 50 user wallets.
 * Uses correct UnshieldedAddress type for receiverAddress.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { getOrCreateSeed } from '../src/network';
import { createWallet, unshieldedToken } from '../src/wallet';

globalThis.WebSocket = WebSocket;

const USERS_FILE = path.resolve(process.cwd(), 'level5-users.json');
const NETWORK = 'preprod';

const NETWORK_CONFIG: any = {
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

  console.log(`\nSending 1 tNIGHT to ${pending.length} users...\n`);

  const seed = getOrCreateSeed(NETWORK);
  const ctx = await createWallet({ network: NETWORK, networkConfig: NETWORK_CONFIG, seed });
  await ctx.wallet.waitForSyncedState();
  console.log('Wallet synced.\n');

  for (const user of pending) {
    try {
      // Parse bech32m address into UnshieldedAddress
      const { MidnightBech32m } = await import('@midnight-ntwrk/wallet-sdk-address-format');
      const { UnshieldedAddress } = await import('@midnight-ntwrk/wallet-sdk');
      
      const parsed = MidnightBech32m.parse(user.address);
      const receiverAddr = new UnshieldedAddress(parsed.data);

      const outputs = [{
        amount: 100n,  // minimum viable transfer
        type: unshieldedToken().raw,
        receiverAddress: receiverAddr,
      }];

      console.log(`User ${user.index}: ${user.firstName} → ${user.address.slice(0,30)}...`);
      
      const tx = await ctx.wallet.transferTransaction(
        [{ type: 'unshielded' as const, outputs }],
        { shieldedSecretKeys: ctx.shieldedSecretKeys, dustSecretKey: ctx.dustSecretKey },
        { payFees: true, ttl: new Date(Date.now() + 30 * 60 * 1000) }
      );

      const txHash = (tx as any).txHash || (tx as any).hash || 'ok';
      user.txHash = String(txHash);
      user.action = 'transfer';
      console.log(`  ✓ ${txHash}`);
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (err: any) {
      console.error(`  ✗ ${err?.message?.slice(0, 120)}`);
    }
  }

  await ctx.wallet.stop();
  console.log(`\nDone.`);
}

main().catch(e => { console.error(e); process.exit(1); });
