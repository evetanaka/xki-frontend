import { useState, useCallback, useEffect } from 'react';
import { CHAIN_ID } from '../lib/constants';

declare global {
  interface Window {
    keplr?: {
      enable: (chainId: string) => Promise<void>;
      experimentalSuggestChain: (chainInfo: any) => Promise<void>;
      getOfflineSigner: (chainId: string) => any;
      signArbitrary: (chainId: string, signer: string, data: string) => Promise<{ signature: string; pub_key: { value: string } }>;
    };
  }
}

const KI_CHAIN_INFO = {
  chainId: 'kichain-2',
  chainName: 'Ki Chain',
  rpc: 'https://rpc-mainnet.blockchain.ki',
  rest: 'https://api-mainnet.blockchain.ki',
  bip44: { coinType: 118 },
  bech32Config: {
    bech32PrefixAccAddr: 'ki',
    bech32PrefixAccPub: 'kipub',
    bech32PrefixValAddr: 'kivaloper',
    bech32PrefixValPub: 'kivaloperpub',
    bech32PrefixConsAddr: 'kivalcons',
    bech32PrefixConsPub: 'kivalconspub',
  },
  currencies: [
    { coinDenom: 'XKI', coinMinimalDenom: 'uxki', coinDecimals: 6 },
  ],
  feeCurrencies: [
    {
      coinDenom: 'XKI',
      coinMinimalDenom: 'uxki',
      coinDecimals: 6,
      gasPriceStep: { low: 0.025, average: 0.03, high: 0.05 },
    },
  ],
  stakeCurrency: { coinDenom: 'XKI', coinMinimalDenom: 'uxki', coinDecimals: 6 },
};

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useKeplrWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isLoading: false,
    error: null,
  });

  // Restore session on mount
  useEffect(() => {
    const saved = localStorage.getItem('xki_wallet');
    if (saved && window.keplr) {
      connect();
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.keplr) {
      setState((s) => ({ ...s, error: 'Keplr wallet not found. Please install the Keplr extension.' }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      // Suggest Ki Chain to Keplr if not already added
      if (window.keplr.experimentalSuggestChain) {
        await window.keplr.experimentalSuggestChain(KI_CHAIN_INFO);
      }
      await window.keplr.enable(CHAIN_ID);
      const signer = window.keplr.getOfflineSigner(CHAIN_ID);
      const accounts = await signer.getAccounts();
      const address = accounts[0]?.address;

      if (!address) throw new Error('No accounts found');

      localStorage.setItem('xki_wallet', address);
      setState({ address, isConnected: true, isLoading: false, error: null });
    } catch (err: any) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err.message || 'Failed to connect wallet',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem('xki_wallet');
    setState({ address: null, isConnected: false, isLoading: false, error: null });
  }, []);

  const signMessage = useCallback(
    async (message: string) => {
      if (!window.keplr || !state.address) throw new Error('Wallet not connected');
      return window.keplr.signArbitrary(CHAIN_ID, state.address, message);
    },
    [state.address]
  );

  return { ...state, connect, disconnect, signMessage };
}
