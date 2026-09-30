import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import {
  Zap,
  Settings,
  User,
  Shield,
  Layers,
  FileText,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { contractService } from '../services/contractService';
import { api } from '../services/api';
import { NavigationTab } from '../components/Navigation';

interface DashboardPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    account,
    role,
    isConnected,
    connectWallet,
    provider,
    chainId,
    networkName,
  } = useWeb3();

  const [totalIdentities, setTotalIdentities] = useState<number>(0);
  const [totalAssets, setTotalAssets] = useState<number>(0);
  const [totalRoles, setTotalRoles] = useState<number>(4);
  const [totalAuditRecords, setTotalAuditRecords] = useState<number>(0);
  const [showContractsModal, setShowContractsModal] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const [allAssets, allIdentities, auditRes] = await Promise.all([
          contractService.getAllAssets(provider).catch(() => []),
          contractService.getAllIdentities(provider).catch(() => []),
          api.getAuditLogs({ limit: 1 }).catch(() => ({ total: 0 })),
        ]);

        if (allAssets) setTotalAssets(allAssets.length);
        if (allIdentities) setTotalIdentities(allIdentities.length);
        if (auditRes && typeof auditRes.total === 'number') {
          setTotalAuditRecords(auditRes.total);
        }
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      }
    };

    fetchTelemetry();
  }, [provider]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const contracts = [
    { name: 'DecentraXAccessControl', address: '0x1d1d0957476A63fFfA4B43Ea22F7fA1DC816A57D', role: 'Role-Based Access Control' },
    { name: 'IdentityRegistry', address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', role: 'W3C DID & KYC Hash Registry' },
    { name: 'AssetNFT', address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', role: 'ERC-721 Defense Asset NFT' },
    { name: 'DecentraXAuditLogger', address: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9', role: 'Immutable Security Audit Journal' },
  ];

  return (
    <div className="space-y-6 select-none">
      
      {/* 1. Hero Welcome Card (Matching Reference Screenshot) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#EDF5FF] via-[#E6F0FC] to-[#DCEBFC] border border-[#CDE0F7] p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 max-w-2xl">
          <div className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">
            WELCOME TO
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0C2B59] tracking-tight mt-1 mb-2">
            DecentraX
          </h1>
          <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
            Secure Identity, Access Control and Digital Asset Management for Bharat Electronics Limited
          </p>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-slate-500 font-medium mt-4">
            <span>Blockchain</span>
            <span className="text-slate-300">|</span>
            <span>Transparency</span>
            <span className="text-slate-300">|</span>
            <span>Security</span>
            <span className="text-slate-300">|</span>
            <span>Auditability</span>
          </div>
        </div>

        {/* Right: Institutional Building Illustration */}
        <div className="hidden lg:block absolute right-0 bottom-0 top-0 w-[50%] xl:w-[48%] pointer-events-none select-none">
          <img
            src="/hero-building.png"
            alt="Bharat Electronics Limited Headquarters"
            className="w-full h-full object-cover object-right-bottom opacity-95"
          />
        </div>
      </div>

      {/* 2. Key Metrics Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Identities */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow flex items-center space-x-4">
          <div className="w-13 h-13 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-[#16A34A]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">Registered Identities</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {totalIdentities}
            </div>
            <span className="text-xs text-slate-500 block mt-0.5">Total DIDs created</span>
          </div>
        </div>

        {/* Card 2: Digital Assets */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow flex items-center space-x-4">
          <div className="w-13 h-13 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">Digital Assets</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {totalAssets}
            </div>
            <span className="text-xs text-slate-500 block mt-0.5">Assets (ERC-721)</span>
          </div>
        </div>

        {/* Card 3: Access Roles */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow flex items-center space-x-4">
          <div className="w-13 h-13 rounded-full bg-[#F3E8FF] flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-[#9333EA]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">Access Roles</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {totalRoles}
            </div>
            <span className="text-xs text-slate-500 block mt-0.5">Active roles</span>
          </div>
        </div>

        {/* Card 4: Audit Records */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow flex items-center space-x-4">
          <div className="w-13 h-13 rounded-full bg-[#FFEDD5] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-[#EA580C]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">Audit Records</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {totalAuditRecords}
            </div>
            <span className="text-xs text-slate-500 block mt-0.5">On-chain records</span>
          </div>
        </div>
      </div>

      {/* 3. Lower Section: Two Columns (Quick Actions & System Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Quick Actions (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center space-x-2 mb-4 pb-1">
            <Zap className="w-5 h-5 text-[#0052CC]" />
            <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Action 1 */}
            <div
              onClick={() => onNavigate('identity')}
              className="group p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 block">
                    Create Identity (DID)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Register a new identity on blockchain
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            </div>

            {/* Action 2 */}
            <div
              onClick={() => onNavigate('roles')}
              className="group p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 block">
                    Manage Access
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Assign and manage roles
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            </div>

            {/* Action 3 */}
            <div
              onClick={() => onNavigate('assets')}
              className="group p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 block">
                    Mint Digital Asset
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Create and register new asset (ERC-721)
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            </div>

            {/* Action 4 */}
            <div
              onClick={() => onNavigate('verify')}
              className="group p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 block">
                    Verify Record
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Verify identity or asset on-chain
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            </div>
          </div>
        </div>

        {/* Right Column: System Status (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4 pb-1">
              <Settings className="w-5 h-5 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">System Status</h2>
            </div>

            {/* Smart Contracts Deployed Alert Box */}
            <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3.5 flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Smart Contracts Deployed
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.2">
                    Connected to Polygon Amoy Testnet
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowContractsModal(true)}
                className="text-xs font-semibold text-[#0052CC] hover:underline cursor-pointer"
              >
                View Details
              </button>
            </div>

            {/* Status Table List */}
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Network</span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-800 font-semibold">{networkName || 'Polygon Amoy Testnet'}</span>
                  <span className="bg-[#D1FAE5] text-[#065F46] font-semibold text-[10px] px-2 py-0.5 rounded-full">
                    Connected
                  </span>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Chain ID</span>
                <span className="font-mono text-slate-800 font-medium">{chainId || 80002}</span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Wallet Status</span>
                {isConnected ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Connected
                  </span>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Not Connected</span>
                    <button
                      onClick={connectWallet}
                      className="px-2.5 py-1 bg-[#0052CC] hover:bg-[#0047B3] text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      Connect
                    </button>
                  </div>
                )}
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Contract Addresses</span>
                <button
                  onClick={() => setShowContractsModal(true)}
                  className="text-[#0052CC] hover:underline font-semibold cursor-pointer"
                >
                  View Contracts
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Contract Addresses Modal */}
      {showContractsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Deployed Smart Contracts (Polygon Amoy)
              </h3>
              <button
                onClick={() => setShowContractsModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {contracts.map((c) => (
                <div key={c.name} className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{c.name}</span>
                    <span className="text-[10px] text-slate-500">{c.role}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 font-mono text-[11px] text-slate-600 bg-white border border-slate-200 rounded px-2 py-1">
                    <span className="truncate mr-2">{c.address}</span>
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => copyToClipboard(c.address)}
                        title="Copy address"
                        className="p-1 rounded hover:bg-slate-100 text-slate-500"
                      >
                        {copiedAddress === c.address ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={`https://amoy.polygonscan.com/address/${c.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded hover:bg-slate-100 text-blue-600"
                        title="View on PolygonScan"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowContractsModal(false)}
                className="px-4 py-2 bg-[#0052CC] hover:bg-[#0047B3] text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
