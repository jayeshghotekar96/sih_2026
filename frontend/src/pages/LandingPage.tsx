import React from 'react';
import { useWeb3, SUPPORTED_NETWORKS } from '../hooks/useWeb3';
import {
  Shield,
  KeyRound,
  FileCheck2,
  Boxes,
  Lock,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  SearchCheck,
} from 'lucide-react';
import { NavigationTab } from '../components/Navigation';

interface LandingPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { isConnected, connectWallet, role, networkName, isCorrectNetwork, switchNetwork } = useWeb3();

  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <section className="decentra-card p-8 md:p-12 bg-white relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-4 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Bharat Electronics Limited (BEL) • SIH 2026 Problem SIH26125</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0B192C] leading-tight">
            Secure Identities.<br />
            Control Access.<br />
            <span className="text-blue-700">Own Assets.</span>
          </h1>

          <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed font-normal">
            <strong>DecentraX</strong> is a unified, defence-grade blockchain platform connecting{' '}
            <span className="text-slate-900 font-medium">Decentralized Identity (DID)</span>,{' '}
            <span className="text-slate-900 font-medium">Role-Based Access Control (RBAC)</span>,{' '}
            <span className="text-slate-900 font-medium">Verifiable Digital Asset Custody</span>, and{' '}
            <span className="text-slate-900 font-medium">Immutable Auditability</span> for critical organizational infrastructure.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="decentra-btn-primary px-6 py-3 text-base flex items-center space-x-2 shadow-md"
              >
                <KeyRound className="w-5 h-5 text-sky-400" />
                <span>Connect MetaMask</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('dashboard')}
                className="decentra-btn-primary px-6 py-3 text-base flex items-center space-x-2 shadow-md"
              >
                <span>Enter Operational Console</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => onNavigate('roles')}
              className="decentra-btn-secondary px-5 py-3 text-sm flex items-center space-x-2"
            >
              <Lock className="w-4 h-4 text-slate-600" />
              <span>Roles & RBAC</span>
            </button>

            <button
              onClick={() => onNavigate('verify')}
              className="decentra-btn-secondary px-5 py-3 text-sm flex items-center space-x-2"
            >
              <SearchCheck className="w-4 h-4 text-slate-600" />
              <span>Auditor Suite</span>
            </button>
          </div>

          {/* Network & Security Posture Strip */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Cryptographic DID Architecture</span>
            </div>
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>ERC-721 Digital Records (Polygon Amoy)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-purple-600" />
              <span>IPFS / Pinata Decentralized Storage</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Lifecycle Flow */}
      <section className="space-y-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700">The DecentraX Lifecycle</h2>
          <p className="text-xl font-bold text-slate-900 mt-1">Unified Security Pipeline</p>
          <p className="text-xs text-slate-500">
            From cryptographically verified registration to complete chain-of-custody audit.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
          {[
            { step: '01', title: 'Create Identity', desc: 'Wallet-bound DID record', tab: 'identity' },
            { step: '02', title: 'Assign Role', desc: 'Multi-tier RBAC smart contract', tab: 'roles' },
            { step: '03', title: 'Create Asset', desc: 'Metadata & dossier to IPFS', tab: 'mint' },
            { step: '04', title: 'Mint NFT', desc: 'ERC-721 verifiable digital token', tab: 'assets' },
            { step: '05', title: 'Allocate', desc: 'Assign custody to verified DID', tab: 'assets' },
            { step: '06', title: 'Check Access', desc: 'On-chain policy evaluation', tab: 'access' },
            { step: '07', title: 'Verify', desc: 'Cryptographic proof inspection', tab: 'verify' },
            { step: '08', title: 'Audit', desc: 'Immutable append-only journal', tab: 'audit' },
          ].map((item, idx) => (
            <div
              key={item.step}
              onClick={() => onNavigate(item.tab as NavigationTab)}
              className="p-3 bg-white border border-slate-200 rounded-md shadow-subtle hover:border-blue-400 hover:shadow-md cursor-pointer transition-all text-center group"
            >
              <span className="text-[10px] font-bold font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                {item.step}
              </span>
              <h4 className="text-xs font-semibold text-slate-800 mt-2 group-hover:text-blue-700 transition-colors">
                {item.title}
              </h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Architectural Pillars (Comparison & Defence Context) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="decentra-card p-6 border-slate-200 hover:border-slate-300 transition-all">
          <div className="w-10 h-10 rounded bg-sky-50 flex items-center justify-center text-blue-700 mb-4 border border-sky-100">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Decentralized Identity (DID)</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Eliminates single points of failure in Active Directory/LDAP. Cryptographically maps wallet addresses to verifiable identity credentials with department clearances without publishing sensitive PII on-chain.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-slate-600">
            <li className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>DID Schema: <code className="font-mono text-[11px] bg-slate-100 px-1 rounded">did:decentrax:&lt;addr&gt;</code></span>
            </li>
            <li className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Off-chain cryptographic hash verification</span>
            </li>
          </ul>
        </div>

        <div className="decentra-card p-6 border-slate-200 hover:border-slate-300 transition-all">
          <div className="w-10 h-10 rounded bg-purple-50 flex items-center justify-center text-purple-700 mb-4 border border-purple-100">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Role-Based Access Control</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Enforced directly via smart contract modifiers and on-chain permission evaluation. Separation of duties between Admin, Manager, Auditor, and User cannot be bypassed by frontend tampering.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-slate-600">
            <li className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>OpenZeppelin AccessControl architecture</span>
            </li>
            <li className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live cryptographic policy evaluation engine</span>
            </li>
          </ul>
        </div>

        <div className="decentra-card p-6 border-slate-200 hover:border-slate-300 transition-all">
          <div className="w-10 h-10 rounded bg-emerald-50 flex items-center justify-center text-emerald-700 mb-4 border border-emerald-100">
            <Boxes className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Digital Asset Custody (ERC-721)</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            NFTs serve as verifiable digital representations of critical defence assets (hardware modules, cryptographic keys, schematics) bound to IPFS metadata CIDs with audited chain-of-custody.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-slate-600">
            <li className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>IPFS / Pinata decentralized storage</span>
            </li>
            <li className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full custody provenance and audit history</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Honest Technical Notice */}
      <section className="p-4 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-slate-700 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-900">Technical Transparency & Defence Standards:</h4>
            <p className="mt-0.5 leading-relaxed">
              DecentraX treats ERC-721 NFTs strictly as cryptographic digital representation and custody tracking records for physical and digital assets, not automatic proof of physical property law. All personnel dossiers and sensitive technical schematics remain securely stored off-chain/IPFS with tamper-evident hashes registered on Polygon Amoy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
