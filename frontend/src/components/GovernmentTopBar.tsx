import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { Search, Globe, Eye, Wifi, ExternalLink } from 'lucide-react';

export const GovernmentTopBar: React.FC = () => {
  const { chainId, isConnected, isCorrectNetwork, networkName, account } = useWeb3();
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');

  return (
    <div className="bg-[#1E293B] text-slate-300 text-[11px] py-1 px-4 border-b border-slate-700 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Left: Official Indian Ministry of Defence & Government Tag */}
        <div className="flex items-center space-x-3 text-[11px] font-medium tracking-wide">
          <span className="text-white font-semibold flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 bg-gradient-to-b from-amber-500 via-white to-emerald-600 inline-block rounded-xs"></span>
            भारत सरकार | Government of India
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">
            रक्षा मंत्रालय | Ministry of Defence
          </span>
          <span className="hidden lg:inline text-slate-500">|</span>
          <span className="hidden lg:inline text-amber-300 font-medium">
            Smart India Hackathon 2026 (SIH26125)
          </span>
        </div>

        {/* Right: Accessibility Controls & Network Telemetry */}
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="hover:text-white cursor-pointer hidden sm:inline">
            Skip to main content
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="hover:text-white cursor-pointer hidden sm:inline flex items-center gap-1">
            <Eye className="w-3 h-3 text-slate-400" />
            Screen Reader
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'EN' ? 'HI' : 'EN')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold border border-slate-600 text-[10px]"
          >
            {lang === 'EN' ? 'हिन्दी' : 'English'}
          </button>

          <span className="text-slate-600">|</span>

          {/* Blockchain Network Status */}
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? (isCorrectNetwork ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-200 font-mono text-[10px]">
              {isConnected ? networkName : 'Wallet Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
