import React from 'react';
import { Volume2, ShieldCheck, CheckCircle } from 'lucide-react';

export const FlashNewsBar: React.FC = () => {
  return (
    <div className="bg-[#026cb6] text-white py-1 px-4 border-t border-b border-[#00539c] shadow-xs select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        {/* Flash News Pill Button (identical to BEL screenshot) */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="bg-[#00386b] text-white px-3.5 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] shadow-xs flex items-center gap-1.5 border border-sky-400/30">
            <Volume2 className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
            Flash News
          </span>
        </div>

        {/* Marquee / Live Ticker Text */}
        <div className="flex-1 overflow-hidden font-medium text-slate-100 text-[12px] whitespace-nowrap">
          <div className="inline-flex space-x-8">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <strong>DecentraX Blockchain Platform Active:</strong> Identity (W3C DID), Access Control (RBAC), and Digital Asset (ERC-721) Smart Contracts Deployed for Bharat Electronics Limited.
            </span>
            <span className="text-sky-200">•</span>
            <span className="text-white">
              Polygon Amoy (Chain ID 80002) / Local EVM Enclave Synchronized • Zero Unauthorized Operations Detected • IPFS Pinata Gateway Verified.
            </span>
            <span className="text-sky-200">•</span>
            <span className="text-amber-200 font-semibold">
              SIH 2026 Problem Statement SIH26125 Security Prototype.
            </span>
          </div>
        </div>

        {/* Tamper Proof Status Pill */}
        <div className="hidden md:flex items-center space-x-1.5 bg-[#00386b] px-2.5 py-0.5 rounded text-[10px] text-emerald-300 border border-emerald-400/40 shrink-0 font-semibold">
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          <span>TAMPER-PROOF STATE</span>
        </div>
      </div>
    </div>
  );
};
