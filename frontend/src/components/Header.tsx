import React from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { NationalEmblem } from './NationalEmblem';
import { Shield, KeyRound, CheckCircle, ShieldAlert, Award, ChevronRight, LogOut, Wallet } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    account,
    role,
    identity,
    isConnected,
    isCorrectNetwork,
    networkName,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWeb3();

  const getRoleBadgeStyle = () => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-50 text-red-800 border-red-300 font-bold';
      case 'MANAGER':
        return 'bg-blue-50 text-blue-800 border-blue-300 font-bold';
      case 'AUDITOR':
        return 'bg-purple-50 text-purple-800 border-purple-300 font-bold';
      case 'USER':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Official Bharat Electronics Logo */}
          <div className="flex items-center space-x-4">
            <a href="/" className="shrink-0 flex items-center">
              <img
                src="/bel-logo.png"
                alt="Bharat Electronics Limited"
                className="h-14 sm:h-16 w-auto object-contain"
                onError={(e) => {
                  // Fallback if image fails
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="hidden items-center space-x-2">
                <div className="w-12 h-12 rounded bg-[#004B87] text-white flex items-center justify-center font-bold text-xl">
                  BEL
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base">भारत इलेक्ट्रॉनिक्स</div>
                  <div className="font-bold text-[#004B87] text-sm tracking-wide">BHARAT ELECTRONICS</div>
                </div>
              </div>
            </a>

            {/* Vertical Divider */}
            <div className="hidden sm:block h-12 w-px bg-slate-200"></div>

            {/* Ministry & Enterprise Info */}
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  Bharat Electronics Limited
                </h1>
                <span className="hidden lg:inline text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  A Navratna Company
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-normal">
                Government of India, Ministry of Defence • CIN: L32309KA1954GOI000787
              </p>
              <p className="text-xs text-[#004B87] font-semibold mt-0.5">
                DecentraX: Blockchain Platform for Identity, Access Control & Asset Management (SIH26125)
              </p>
            </div>
          </div>

          {/* Right: National Emblem + Wallet Authentication Bar */}
          <div className="flex items-center space-x-4 self-end md:self-center">
            {/* National Emblem of India */}
            <div className="hidden sm:flex items-center pr-3 border-r border-slate-200">
              <NationalEmblem className="w-9 h-12 text-slate-800" />
            </div>

            {/* Wallet State & User Actions */}
            <div className="flex items-center space-x-2">
              {isConnected && account ? (
                <div className="flex items-center space-x-2">
                  {/* Role Badge */}
                  <div className={`px-2.5 py-1 rounded text-xs border ${getRoleBadgeStyle()} flex items-center space-x-1.5 shadow-2xs`}>
                    <Shield className="w-3.5 h-3.5" />
                    <span>{role}</span>
                  </div>

                  {/* Account Pill */}
                  <div className="bg-slate-100 border border-slate-200 px-3 py-1 rounded text-xs font-mono text-slate-800">
                    <span className="text-slate-500 mr-1.5">Wallet:</span>
                    <span className="font-semibold">{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
                  </div>

                  {/* Disconnect Button */}
                  <button
                    onClick={disconnectWallet}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-rose-600 border border-transparent hover:border-slate-200 transition-colors"
                    title="Disconnect Wallet"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="decentra-btn-primary flex items-center space-x-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect MetaMask</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
