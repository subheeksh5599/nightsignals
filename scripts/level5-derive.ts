/**
 * Level 5 — Derive 50 wallet addresses from seeds and save to JSON.
 * Run this on the VPS where the midnight SDK is installed.
 *
 * Usage: npx tsx scripts/level5-derive.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { createKeystore } from '@midnight-ntwrk/wallet-sdk';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk';

const NETWORK = 'preprod';
const INPUT_FILE = path.resolve(process.cwd(), 'level5-users.json');

interface UserEntry {
  index: number;
  firstName: string;
  lastName: string;
  email: string;
  seed: string;
  address: string | null;
  action: string;
  txHash: string | null;
}

setNetworkId(NETWORK);
const networkId = getNetworkId();

const users: UserEntry[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

for (const user of users) {
  try {
    const hdWallet = HDWallet.fromSeed(Buffer.from(user.seed, 'hex'));
    if (hdWallet.type !== 'seedOk') {
      console.error(`User ${user.index}: invalid seed`);
      continue;
    }
    const keys = hdWallet.hdWallet
      .selectAccount(0)
      .selectRoles([Roles.NightExternal])
      .deriveKeysAt(0);
    if (keys.type !== 'keysDerived') {
      console.error(`User ${user.index}: key derivation failed`);
      continue;
    }
    const keystore = createKeystore(keys.keys[Roles.NightExternal], networkId);
    user.address = keystore.getBech32Address().toString();
    hdWallet.hdWallet.clear();
    console.log(`User ${user.index}: ${user.firstName} ${user.lastName} → ${user.address}`);
  } catch (err: any) {
    console.error(`User ${user.index}: error - ${err.message}`);
  }
}

fs.writeFileSync(INPUT_FILE, JSON.stringify(users, null, 2));
console.log(`\nDone. Updated ${INPUT_FILE} with ${users.filter(u => u.address).length} addresses.`);
