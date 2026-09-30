import { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import React from 'react';
import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers';
import { Identity, Role, Web3State } from '../types';
import { contractService } from '../services/contractService';
import { api } from '../services/api';

// Supported networks
export const SUPPORTED_NETWORKS = {
  AMOY: {
    chainId: 80002,
    hexChainId: '0x13882',
    name: 'Polygon Amoy Testnet',
    rpcUrl: 'https://rpc-amoy.polygon.technology/',
    currency: 'POL',
    explorer: 'https://amoy.polygonscan.com',
  },
  LOCALHOST: {
    chainId: 31337,
    hexChainId: '0x7a69',
    name: 'Hardhat Localhost (31337)',
    rpcUrl: 'http://127.0.0.1:8545',
    currency: 'ETH',
    explorer: '',
  },
};

interface Web3ContextType extends Web3State {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (targetChainId?: number) => Promise<void>;
  refreshState: () => Promise<void>;
  authenticateWithBackend: () => Promise<boolean>;
  isAuthenticated: boolean;
  networkName: string;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('UNASSIGNED');
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isCorrectNetwork =
    chainId === SUPPORTED_NETWORKS.AMOY.chainId || chainId === SUPPORTED_NETWORKS.LOCALHOST.chainId;

  const getNetworkName = () => {
    if (chainId === SUPPORTED_NETWORKS.AMOY.chainId) return 'Polygon Amoy Testnet';
    if (chainId === SUPPORTED_NETWORKS.LOCALHOST.chainId) return 'Hardhat Localhost (31337)';
    if (chainId) return `Unsupported (${chainId})`;
    return 'Not Connected';
  };

  // Load identity and role for the connected address
  const loadAccountData = useCallback(async (addr: string, currentSignerOrProvider: ethers.ContractRunner) => {
    try {
      const [fetchedRole, fetchedIdentity] = await Promise.all([
        contractService.getRole(addr, currentSignerOrProvider),
        contractService.getIdentity(addr, currentSignerOrProvider),
      ]);
      setRole(fetchedRole);
      setIdentity(fetchedIdentity);
    } catch (err: any) {
      console.warn('Failed to load account identity/role:', err);
    }
  }, []);

  const refreshState = useCallback(async () => {
    if (account && (signer || provider)) {
      await loadAccountData(account, signer || provider!);
    }
  }, [account, signer, provider, loadAccountData]);

  // Connect MetaMask
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to interact with DecentraX.');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const ethProvider = new BrowserProvider((window as any).ethereum);
      const accounts = await ethProvider.send('eth_requestAccounts', []);
      const currentNetwork = await ethProvider.getNetwork();
      const currentChainId = Number(currentNetwork.chainId);
      const currentSigner = await ethProvider.getSigner();
      const currentAccount = accounts[0];

      setProvider(ethProvider);
      setSigner(currentSigner);
      setAccount(currentAccount);
      setChainId(currentChainId);

      await loadAccountData(currentAccount, currentSigner);
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      if (err.code === 4001) {
        setError('Connection request was rejected in MetaMask.');
      } else {
        setError(err.message || 'Failed to connect MetaMask.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setRole('UNASSIGNED');
    setIdentity(null);
    setIsAuthenticated(false);
  };

  // Switch or Add Network
  const switchNetwork = async (targetChainId: number = SUPPORTED_NETWORKS.AMOY.chainId) => {
    if (!(window as any).ethereum) return;

    const targetConfig =
      targetChainId === SUPPORTED_NETWORKS.AMOY.chainId
        ? SUPPORTED_NETWORKS.AMOY
        : SUPPORTED_NETWORKS.LOCALHOST;

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetConfig.hexChainId }],
      });
    } catch (switchError: any) {
      // Chain not added error code: 4902
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: targetConfig.hexChainId,
                chainName: targetConfig.name,
                rpcUrls: [targetConfig.rpcUrl],
                nativeCurrency: {
                  name: targetConfig.currency,
                  symbol: targetConfig.currency,
                  decimals: 18,
                },
                blockExplorerUrls: targetConfig.explorer ? [targetConfig.explorer] : undefined,
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  };

  // Authenticate session via cryptographic EIP-191 challenge signature
  const authenticateWithBackend = async (): Promise<boolean> => {
    if (!account || !signer) return false;
    try {
      const challenge = await api.getChallenge(account);
      const signature = await signer.signMessage(challenge.message);
      const res = await api.verifyAuth(account, signature);
      if (res.authenticated) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Cryptographic authentication failed:', err);
      setError(err.message || 'Authentication failed');
      return false;
    }
  };

  const providerRef = useRef(provider);
  providerRef.current = provider;

  const loadAccountDataRef = useRef(loadAccountData);
  loadAccountDataRef.current = loadAccountData;

  // Listen to MetaMask account and chain events (registered only once on mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;

      // Safely increase listener capacity if available on the provider
      try {
        if (typeof eth.setMaxListeners === 'function') {
          eth.setMaxListeners(50);
        }
      } catch (e) {
        // ignore if not supported
      }

      const handleAccountsChanged = async (accounts: string[]) => {
        if (!accounts || accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
          try {
            const currentEthProvider = providerRef.current || new BrowserProvider(eth);
            const newSigner = await currentEthProvider.getSigner();
            setSigner(newSigner);
            await loadAccountDataRef.current(accounts[0], newSigner);
          } catch (e) {
            console.warn('Could not refresh signer for new account:', e);
          }
        }
      };

      const handleChainChanged = (hexChain: string) => {
        setChainId(parseInt(hexChain, 16));
        window.location.reload();
      };

      eth.on('accountsChanged', handleAccountsChanged);
      eth.on('chainChanged', handleChainChanged);

      return () => {
        if (typeof eth.removeListener === 'function') {
          eth.removeListener('accountsChanged', handleAccountsChanged);
          eth.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // Initial check if wallet already connected (runs only once on mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const checkConnection = async () => {
        try {
          const eth = (window as any).ethereum;
          const ethProvider = new BrowserProvider(eth);
          const accounts = await ethProvider.listAccounts();
          if (accounts.length > 0) {
            const currentAccount = accounts[0].address;
            const currentNetwork = await ethProvider.getNetwork();
            const currentSigner = await ethProvider.getSigner();

            setProvider(ethProvider);
            setSigner(currentSigner);
            setAccount(currentAccount);
            setChainId(Number(currentNetwork.chainId));
            await loadAccountDataRef.current(currentAccount, currentSigner);
          }
        } catch (e) {
          // not connected
        }
      };
      checkConnection();
    }
  }, []);

  const value: Web3ContextType = {
    account,
    chainId,
    isConnecting,
    isConnected: !!account,
    error,
    role,
    identity,
    isCorrectNetwork,
    provider,
    signer,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshState,
    authenticateWithBackend,
    isAuthenticated,
    networkName: getNetworkName(),
  };

  return React.createElement(Web3Context.Provider, { value }, children);
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
