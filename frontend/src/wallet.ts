import type { InitialAPI, API } from './types';

declare global {
  interface Window {
    midnight?: Record<string, InitialAPI>;
  }
}

export function listWallets(): InitialAPI[] {
  const injected = window.midnight;
  return injected ? Object.values(injected) : [];
}

export function selectFirstWallet(): InitialAPI {
  const wallets = listWallets();
  if (wallets.length === 0) {
    throw new Error('No Midnight wallet found. Please install Lace wallet extension.');
  }
  return wallets[0];
}

export async function connectWallet(wallet: InitialAPI): Promise<API> {
  const isEnabled = await wallet.isEnabled();
  if (!isEnabled) {
    throw new Error('Wallet is not enabled. Please open Lace and enable Midnight support.');
  }
  return wallet.api();
}
// handle lace wallet disconnect gracefully on page u
// retry wallet connection up to 3 times on transient
// clear stale wallet state when switching networks
// 1785426837
// 1785426837
// 1785426837
