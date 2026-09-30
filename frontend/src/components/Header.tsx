import React from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { Wallet, LogOut, CheckCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    account,
    role,
    isConnected,
    isCorrectNetwork,
    networkName,
    chainId,
    connectWallet,
    disconnectWallet,
  } = useWeb3();

  const formattedAccount = account
    ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
    : '';

  return (
    <header className="bg-white border-b border-slate-200 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Official BEL Brand Header & Project Subtitle */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* BEL Logo Mark */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="w-12 h-11 rounded-lg bg-[#004B87] text-white flex items-center justify-center font-extrabold text-lg tracking-wider shadow-xs">
                BEL
              </div>
              <div className="leading-tight hidden sm:block">
                <div className="font-extrabold text-[#002D54] text-xs tracking-tight">भारत इलेक्ट्रॉनिक्स</div>
                <div className="font-extrabold text-[#004B87] text-xs tracking-tight">BHARAT ELECTRONICS</div>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>

            {/* Title & SIH Problem Statement */}
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  Bharat Electronics Limited
                </h1>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  A Navratna Company
                </span>
              </div>
              <p className="text-xs text-slate-600 font-normal mt-0.5">
                DecentraX: Blockchain Platform for Identity, Access Control & Asset Management (SIH26125)
              </p>
            </div>
          </div>

          {/* Right: Network Status Pill & Connect Wallet Button */}
          <div className="flex items-center space-x-3 shrink-0 self-end md:self-auto">
            {/* Network Pill */}
            <div className="border border-slate-200 bg-slate-50/80 rounded-xl px-3.5 py-1.5 text-right">
              <div className="flex items-center space-x-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span className="text-xs font-semibold text-slate-800">
                  {isConnected ? networkName : 'Polygon Amoy Testnet'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Chain ID: {chainId || 80002}
              </div>
            </div>

            {/* Wallet Button */}
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="bg-[#0052CC] hover:bg-[#0047B3] text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                <div className="px-2 py-1 text-left">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-mono font-semibold text-slate-800">
                      {formattedAccount}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded inline-block mt-0.5">
                    {role}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  title="Disconnect"
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-rose-600 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
