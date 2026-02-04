import { Connection, PublicKey } from '@solana/web3.js';

export const CLUSTERS = {
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com'
};

export const DEFAULT_CLUSTER = CLUSTERS.devnet;

export function createConnection(endpoint: string = DEFAULT_CLUSTER) {
  return new Connection(endpoint, 'confirmed');
}

export function parsePublicKey(key: string) {
  try {
    return new PublicKey(key);
  } catch (error) {
    return null;
  }
}
