export interface WalletState {
  isConnected: boolean;
  address: string | null;
  coinPublicKey: string | null;
  error: string | null;
}

export interface API {
  getCoinPublicKey: () => Promise<string>;
  connected?: any; // Full MidnightConnectedAPI from Lace
}
