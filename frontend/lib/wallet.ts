'use client';

import type { API } from './types';

export function listWallets(): string[] {
  try {
    if (typeof window === 'undefined') return [];
    const midnight = (window as any).midnight;
    if (!midnight) return [];
    return Object.keys(midnight);
  } catch {
    return [];
  }
}

export function selectFirstWallet(): string {
  const wallets = listWallets();
  if (wallets.length === 0) throw new Error('No Midnight wallet found. Install Lace.');
  return wallets[0];
}

export async function connectWallet(walletName: string): Promise<API> {
  const midnight = (window as any).midnight;
  if (!midnight) throw new Error('Midnight API not found. Install Lace.');
  const api = await midnight[walletName].enable();
  return api;
}
