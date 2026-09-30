import React, { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ShieldCheck, Copy, Check, ChevronDown, ChevronUp, UserCheck, Shield } from 'lucide-react';

export const DEMO_ACCOUNTS = [
  {
    role: 'ADMIN',
    rank: 'DIRECTOR GENERAL / SYSTEM GOVERNOR',
    name: 'Shri Rajesh Sharma',
    dept: 'Strategic Defence Enclave - BEL Corporate HQ',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
    badgeText: 'ROLE: ADMIN',
    permissions: 'Identity Registration • Role Governance • Asset Revocation • Audit Access',
  },
  {
    role: 'MANAGER',
    rank: 'CHIEF SYSTEMS ENGINEER',
    name: 'Dr. Ananya Roy',
    dept: 'Avionics & Radar Systems Division - BEL Bangalore',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300 font-bold',
    badgeText: 'ROLE: MANAGER',
    permissions: 'Asset Creation • IPFS Dossier Upload • ERC-721 Minting • Custody Allocation',
  },
  {
    role: 'AUDITOR',
    rank: 'CHIEF COMPLIANCE & QUALITY AUDITOR',
    name: 'Shri Vikramaditya Rao',
    dept: 'Quality Assurance & Technical Audit - BEL',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300 font-bold',
    badgeText: 'ROLE: AUDITOR',
    permissions: 'Identity Attestation • Asset Verification • Immutable Log Inspection',
  },
  {
    role: 'USER',
    rank: 'SENIOR TECHNICAL SPECIALIST',
    name: 'Smt. Priya Nair',
    dept: 'Tactical Communications & Naval Systems - BEL',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    badgeText: 'ROLE: USER',
    permissions: 'View Assigned Assets • W3C DID Credential • Authorized Department Actions',
  },
];

export const DemoSwitcher: React.FC = () => {
  const { account } = useWeb3();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  return (
    <div className="bg-slate-100 border-b border-slate-200 text-xs py-1.5 px-4 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#004B87]" />
            SIH Evaluator Quick-Access:
          </span>
          <span className="text-slate-600 hidden md:inline text-xs">
            Pre-configured BEL test accounts with official roles on the blockchain.
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1.5 font-semibold text-xs text-[#004B87] hover:text-[#003366] bg-white border border-slate-300 px-3 py-1 rounded transition-colors shadow-2xs"
        >
          <span>{isOpen ? 'Hide Test Roles' : 'View Test Roles & Wallets (4)'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-200">
          {DEMO_ACCOUNTS.map((persona) => {
            const isCurrent = account?.toLowerCase() === persona.address.toLowerCase();
            return (
              <div
                key={persona.role}
                className={`p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${persona.badgeClass}`}>
                    {persona.badgeText}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      CONNECTED
                    </span>
                  )}
                </div>

                <div className="font-bold text-slate-900 text-sm">{persona.name}</div>
                <div className="text-[11px] text-slate-500 font-medium leading-tight mb-2">
                  {persona.dept}
                </div>

                {/* Wallet Box */}
                <div className="flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded font-mono border border-slate-200 mb-1.5 text-slate-700">
                  <span className="truncate max-w-[170px]">{persona.address}</span>
                  <button
                    onClick={() => copyAddress(persona.address)}
                    className="ml-1 text-slate-500 hover:text-blue-700 transition-colors p-0.5"
                    title="Copy Address"
                  >
                    {copiedAddr === persona.address ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="text-[10px] text-slate-600 leading-tight">
                  <strong className="text-slate-800">Permissions:</strong> {persona.permissions}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
