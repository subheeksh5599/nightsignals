'use client';

import type { API } from './types';

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
}

export interface WalletInfo {
  key: string;
  name: string;
  rdns: string;
  apiVersion: string;
}

export function detectMidnight(): boolean {
  if (typeof window === 'undefined') return false;
  const m = (window as any).midnight;
  return !!(m && typeof m === 'object' && Object.keys(m).length > 0);
}

export async function waitForMidnight(timeoutMs = 5000, intervalMs = 200): Promise<boolean> {
  if (detectMidnight()) return true;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, intervalMs));
    if (detectMidnight()) return true;
  }
  return false;
}

export function listWallets(): WalletInfo[] {
  try {
    if (typeof window === 'undefined') return [];
    const midnight = (window as any).midnight;
    if (!midnight || typeof midnight !== 'object') return [];
    return Object.entries(midnight)
      .filter(([_, api]: [string, any]) => api && typeof api.connect === 'function')
      .map(([key, api]: [string, any]) => ({
        key,
        name: api.name || 'Unknown Wallet',
        rdns: api.rdns || key,
        apiVersion: api.apiVersion || 'unknown',
      }));
  } catch {
    return [];
  }
}

export async function connectWallet(walletKey: string, networkId = 'preprod'): Promise<API> {
  // Wait up to 3 seconds for Lace to inject window.midnight
  const detected = await waitForMidnight(3000, 300);
  
  if (!detected) {
    throw new Error(
      'Lace wallet not detected.\n\n' +
      'Please make sure:\n' +
      '1. Lace browser extension is installed\n' +
      '2. Lace is unlocked\n' +
      '3. You are on the Midnight Preprod network in Lace\n' +
      '4. Refresh this page after switching networks'
    );
  }

  const midnight = (window as any).midnight;
  const initialApi = midnight[walletKey] as MidnightInitialAPI | undefined;
  
  if (!initialApi) {
    const available = Object.keys(midnight).join(', ') || 'none';
    throw new Error(`Wallet "${walletKey}" not found. Available: ${available}`);
  }

  if (typeof initialApi.connect !== 'function') {
    throw new Error('This version of Lace does not support Midnight DApp connections. Please update Lace.');
  }

  try {
    // Connect to Midnight — this will open a Lace approval dialog
    const connected = await initialApi.connect(networkId);
    const addr = await connected.getUnshieldedAddress();

    return {
      getCoinPublicKey: async () => addr.unshieldedAddress,
      connected,
    };
  } catch (err: any) {
    if (err?.message?.includes('rejected') || err?.code === 'REJECTED') {
      throw new Error('Connection rejected. Please approve the connection in the Lace popup.');
    }
    throw err;
  }
}
