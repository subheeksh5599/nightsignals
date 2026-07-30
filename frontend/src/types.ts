// Midnight Lace wallet types
export interface InitialAPI {
  name: string;
  icon: string;
  isEnabled(): Promise<boolean>;
  api(): Promise<API>;
}

export interface API {
  getCoinPublicKey(): Promise<string>;
  getEncryptionPublicKey(): Promise<string>;
  signData(payload: Uint8Array): Promise<Uint8Array>;
}

// Signal types matching the Compact contract
export interface SignalInfo {
  id: number;
  creator: string;
  price: number;
  contentHash: string;
  active: boolean;
  buyerCount: number;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  coinPublicKey: string | null;
  error: string | null;
}
// 1785426837
