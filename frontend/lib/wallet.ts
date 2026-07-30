'use client';

import type { API } from './types';

// The actual Midnight Lace DApp Connector API types
interface MidnightInitialAPI {
  rdns: string;
  name: string;
  icon: string;
  apiVersion: string;
  connect: (networkId: string) => Promise<MidnightConnectedAPI>;
}

interface MidnightConnectedAPI {
  getUnshieldedAddress(): Promise<{ unshieldedAddress: string }>;
  getShieldedAddresses(): Promise<{
    shieldedAddress: string;
    shieldedCoinPublicKey: string;
    shieldedEncryptionPublicKey: string;
  }>;
  getUnshieldedBalances(): Promise<Record<string, bigint>>;
  getShieldedBalances(): Promise<Record<string, bigint>>;
}

export function listWallets(): { key: string; name: string; rdns: string }[] {
  try {
    if (typeof window === 'undefined') return [];
    const midnight = (window as any).midnight;
    if (!midnight || typeof midnight !== 'object') return [];
    return Object.entries(midnight).map(([key, api]: [string, any]) => ({
      key,
      name: api?.name || key,
      rdns: api?.rdns || 'unknown',
    }));
  } catch {
    return [];
  }
}

export async function connectWallet(walletKey: string): Promise<API> {
  const midnight = (window as any).midnight;
  if (!midnight) throw new Error('Lace wallet not detected. Is the Lace extension installed and unlocked?');

  const initialApi = midnight[walletKey] as MidnightInitialAPI | undefined;
  if (!initialApi) throw new Error(`Wallet "${walletKey}" not found in Lace.`);

  if (typeof initialApi.connect !== 'function') {
    throw new Error('Lace API version mismatch. Please update the Lace extension.');
  }

  // Connect to Midnight Preprod
  const connected = await initialApi.connect('preprod');
  const addr = await connected.getUnshieldedAddress();

  return {
    getCoinPublicKey: async () => addr.unshieldedAddress,
    connected,
  };
}
