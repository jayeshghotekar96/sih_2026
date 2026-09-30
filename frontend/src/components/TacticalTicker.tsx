import React, { useState, useEffect } from 'react';
import { Shield, Radio, Wifi, Lock, Cpu, Globe } from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';

export const TacticalTicker: React.FC = () => {
  const { chainId, isConnected } = useWeb3();
  const [timeStr, setTimeStr] = useState<string>('');
  const [zuluStr, setZuluStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-GB', { hour12: false }) + ' IST');
      setZuluStr(now.toISOString().substring(11, 19) + 'Z');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#050914] border-b border-[#1E2D4A] text-[11px] font-mono py-1.5 px-4 text-slate-400 select-none overflow-x-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 whitespace-nowrap">
        {/* Left: Indian Armed Forces & BEL Strategic Cyber Enclave */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-tactical tracking-wider text-emerald-400 font-bold uppercase">
              DEFCON 2 // SECURE DEFENCE ENCLAVE
            </span>
          </div>

          <span className="text-slate-600">|</span>

          <div className="flex items-center space-x-1 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="text-[10px] text-sky-300 font-semibold tracking-wide">
              BEL-C4ISR COMMAND NODE
            </span>
          </div>
        </div>

        {/* Center: System Telemetry & Cryptographic Posture */}
        <div className="hidden lg:flex items-center space-x-4 text-slate-400 text-[10px]">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>ALGORITHM: SHA-256 / KECCAK-256 / EIP-712</span>
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-sky-400" />
            <span>HARDHAT EVM CHAIN: {chainId || 31337}</span>
          </span>
          <span className="text-slate-700">•</span>
          <span className="text-amber-400 font-semibold">
            PROTOCOL: W3C DID + ERC-721 DEFENCE CUSTODY
          </span>
        </div>

        {/* Right: Military Clocks */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#0B1325] px-2 py-0.5 rounded border border-[#1E2D4A]">
            <Globe className="w-3 h-3 text-sky-400" />
            <span className="text-slate-300 font-semibold">{timeStr}</span>
            <span className="text-amber-400 font-bold">({zuluStr})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
