import React from 'react';
import { useWeb3, SUPPORTED_NETWORKS } from '../hooks/useWeb3';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export const NetworkBanner: React.FC = () => {
  const { isConnected, isCorrectNetwork, chainId, switchNetwork } = useWeb3();

  if (!isConnected || isCorrectNetwork) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 text-xs text-amber-900 select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Network Warning:</strong> You are currently connected to Chain ID [{chainId}]. DecentraX smart contracts are deployed on{' '}
            <strong className="text-slate-900">Polygon Amoy Testnet (80002)</strong> or <strong className="text-slate-900">Local Node (31337)</strong>.
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => switchNetwork(SUPPORTED_NETWORKS.AMOY.chainId)}
            className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs transition-colors shadow-2xs"
          >
            <span>Switch to Amoy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
