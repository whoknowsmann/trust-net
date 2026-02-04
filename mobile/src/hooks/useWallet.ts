import { useCallback, useSyncExternalStore } from 'react';
import { Connection, Transaction } from '@solana/web3.js';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { DEFAULT_CLUSTER } from '../utils/solana';

type WalletState = {
  publicKey: string | null;
  authToken: string | null;
};

const listeners = new Set<() => void>();

let walletState: WalletState = {
  publicKey: null,
  authToken: null
};

function setWalletState(next: WalletState) {
  walletState = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return walletState;
}

type AuthorizationResult = {
  authToken: string | null;
  publicKey: string | null;
};

function parseAuthorization(authorization: any): AuthorizationResult {
  const authToken = authorization?.authToken ?? authorization?.auth_token ?? null;
  const publicKey =
    authorization?.publicKey?.toBase58?.() ??
    authorization?.publicKey?.toString?.() ??
    authorization?.publicKey ??
    null;

  return { authToken, publicKey };
}

export function useWallet() {
  const { publicKey, authToken } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  );

  const connect = useCallback(async () => {
    await transact(async (wallet: any) => {
      // NOTE: adjust to actual MWA API if needed.
      const authorization = await wallet.authorize({
        cluster: DEFAULT_CLUSTER,
        identity: {
          name: 'TrustNet Mobile'
        }
      });
      const parsed = parseAuthorization(authorization);
      setWalletState({
        publicKey: parsed.publicKey,
        authToken: parsed.authToken
      });
    });
  }, []);

  const disconnect = useCallback(async () => {
    if (authToken) {
      await transact(async (wallet: any) => {
        // NOTE: adjust to actual MWA API if needed.
        await wallet.deauthorize({ auth_token: authToken });
      });
    }

    setWalletState({ publicKey: null, authToken: null });
  }, [authToken]);

  const signAndSendTransaction = useCallback(
    async (transaction: Transaction, connection: Connection) => {
      return transact(async (wallet: any) => {
        // NOTE: adjust to actual MWA API if needed.
        if (wallet.signAndSendTransactions) {
          const result = await wallet.signAndSendTransactions({
            transactions: [transaction]
          });
          const signature = result?.[0] ?? result?.signatures?.[0];
          if (signature) {
            return signature;
          }
        }

        if (wallet.signTransactions) {
          const signed = await wallet.signTransactions({
            transactions: [transaction]
          });
          const signedTx = signed?.[0] ?? signed?.transactions?.[0];
          if (!signedTx) {
            throw new Error('Wallet did not return a signed transaction.');
          }
          const raw = signedTx.serialize();
          return connection.sendRawTransaction(raw);
        }

        throw new Error('Wallet does not support signing transactions.');
      });
    },
    []
  );

  return {
    connected: Boolean(publicKey),
    publicKey,
    connect,
    disconnect,
    signAndSendTransaction
  };
}
