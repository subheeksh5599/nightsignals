/**
 * Level 5 — Send 1 tNIGHT to each of 50 users (transfer-only, no contract).
 * With WebSocket keepalive patch.
 */
import { WebSocket as WsNative } from 'ws';

// Monkey-patch: auto-ping every 10s to prevent RPC disconnects
const proto = (WsNative as any).prototype;
const origOn = proto.on;
proto.on = function(event: string, listener: any) {
  if (event === 'open') {
    const ws = this;
    return origOn.call(this, event, function(this: any, ...args: any[]) {
      const interval = setInterval(() => {
        if (ws.readyState === 1) try { ws.ping(); } catch(e) {}
        else clearInterval(interval);
      }, 10000);
      ws.on('close', () => clearInterval(interval));
      return listener.apply(this, args);
    });
  }
  return origOn.call(this, event, listener);
};

(globalThis as any).WebSocket = WsNative;

// Now transfer logic
import * as fs from 'node:fs';
import * as path from 'node:path';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { getOrCreateSeed } from '../src/network';
import { createWallet, unshieldedToken } from '../src/wallet';

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

  // Only transfer to users who don't have a txHash yet
  const pending = users.filter(u => !u.txHash || u.txHash === 'verified');
  
  console.log(`\nSending 1 tNIGHT to ${pending.length} users...\n`);

  const seed = getOrCreateSeed(NETWORK);
  const ctx = await createWallet({ network: NETWORK, networkConfig: NETWORK_CONFIG, seed });
  
  console.log('Syncing wallet...');
  await ctx.wallet.waitForSyncedState();
  console.log('Wallet synced.\n');

  for (let i = 0; i < pending.length; i++) {
    const user = pending[i];
    try {
      const { MidnightBech32m } = await import('@midnight-ntwrk/wallet-sdk-address-format');
      const { UnshieldedAddress } = await import('@midnight-ntwrk/wallet-sdk');
      
      const parsed = MidnightBech32m.parse(user.address);
      const receiverAddr = new UnshieldedAddress(parsed.data);

      const outputs = [{
        amount: 100n,
        type: unshieldedToken().raw,
        receiverAddress: receiverAddr,
      }];

      console.log(`[${i+1}/${pending.length}] User ${user.index}: ${user.firstName} → ${user.address.slice(0,30)}...`);
      
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
    // Small delay between txns
    await new Promise(r => setTimeout(r, 2000));
  }

  await ctx.wallet.stop();
  console.log(`\nDone. Updated ${USERS_FILE}`);
}

main().catch(e => { console.error(e); process.exit(1); });
