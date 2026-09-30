import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import {
  Shield,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Users,
  Boxes,
  Lock,
  FileCheck2,
  ArrowRight,
  Activity,
  Layers,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { contractService } from '../services/contractService';
import { api } from '../services/api';
import { Asset, AuditLogEntry } from '../types';
import { NavigationTab } from '../components/Navigation';

interface DashboardPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    account,
    role,
    identity,
    isConnected,
    provider,
    chainId,
    networkName,
  } = useWeb3();

  const [totalIdentitiesCount, setTotalIdentitiesCount] = useState<number>(4);
  const [totalAssetsCount, setTotalAssetsCount] = useState<number>(3);
  const [assignedAssets, setAssignedAssets] = useState<Asset[]>([]);
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [blockNumber, setBlockNumber] = useState<number | null>(null);

  useEffect(() => {
    const fetchDashboardTelemetry = async () => {
      if (!provider) return;
      try {
        setIsLoading(true);
        const [allAssets, allIdentities, auditRes, blk] = await Promise.all([
          contractService.getAllAssets(provider).catch(() => []),
          contractService.getAllIdentities(provider).catch(() => []),
          api.getAuditLogs({ limit: 6 }).catch(() => ({ logs: [] })),
          provider.getBlockNumber().catch(() => null),
        ]);

        setTotalAssetsCount(allAssets.length);
        setTotalIdentitiesCount(allIdentities.length);
        setRecentAssets(allAssets.slice(0, 4));
        setRecentLogs(auditRes.logs || []);
        setBlockNumber(blk);

        if (account) {
          const userAssets = allAssets.filter(
            (a) => a.custodian.toLowerCase() === account.toLowerCase()
          );
          setAssignedAssets(userAssets);
        }
      } catch (err) {
        console.warn('Dashboard telemetry fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardTelemetry();
  }, [provider, account]);

  const getPermissionsForRole = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { perm: 'Register New Personnel Identity (DID)', allowed: true, rule: 'AccessControl: DEFAULT_ADMIN_ROLE' },
          { perm: 'Assign & Revoke RBAC Roles', allowed: true, rule: 'AccessControl: ROLE_ADMIN' },
          { perm: 'Decommission & Manage Defence Assets', allowed: true, rule: 'AssetNFT: ADMIN_PRIVILEGE' },
          { perm: 'Inspect Full Immutable Audit Ledger', allowed: true, rule: 'AuditLogger: FULL_CLEARANCE' },
          { perm: 'Attest Personnel Credentials', allowed: true, rule: 'IdentityRegistry: ATTESTOR' },
        ];
      case 'MANAGER':
        return [
          { perm: 'Ingest & Mint Digital Assets (ERC-721)', allowed: true, rule: 'AssetNFT: MANAGER_ROLE' },
          { perm: 'Allocate Custody to Personnel', allowed: true, rule: 'AssetNFT: ALLOCATION_RIGHTS' },
          { perm: 'Upload Technical Dossiers to IPFS', allowed: true, rule: 'IPFS: PINATA_AUTHENTICATED' },
          { perm: 'Assign Roles to Other Users', allowed: false, rule: 'Restricted to ADMIN' },
          { perm: 'Attest Cryptographic Credentials', allowed: false, rule: 'Restricted to AUDITOR' },
        ];
      case 'AUDITOR':
        return [
          { perm: 'Cryptographically Attest Personnel Identity', allowed: true, rule: 'IdentityRegistry: AUDITOR_ROLE' },
          { perm: 'Verify Asset Ownership & IPFS CIDs', allowed: true, rule: 'AssetNFT: AUDIT_INSPECT' },
          { perm: 'Inspect Security Audit Journal', allowed: true, rule: 'AuditLogger: AUDIT_READ' },
          { perm: 'Mint or Transfer Digital Assets', allowed: false, rule: 'Restricted: Non-Mutating Inspector' },
          { perm: 'Modify RBAC Governance Permissions', allowed: false, rule: 'Restricted to ADMIN' },
        ];
      case 'USER':
      default:
        return [
          { perm: 'View Assigned Defence Assets & CIDs', allowed: true, rule: 'AssetNFT: CUSTODIAN_READ' },
          { perm: 'View Own W3C DID Document & State', allowed: true, rule: 'IdentityRegistry: SELF_READ' },
          { perm: 'Verify Cryptographic Credentials', allowed: true, rule: 'Public Verification Pipeline' },
          { perm: 'Mint Digital Assets or Tokens', allowed: false, rule: 'Restricted to MANAGER' },
          { perm: 'Modify Security Clearances', allowed: false, rule: 'Restricted to ADMIN' },
        ];
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Executive Summary & Security Status Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                System Operational & Synchronized
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                Network: {networkName} (Chain {chainId || 31337})
              </span>
              {blockNumber && (
                <span className="text-xs px-2.5 py-0.5 rounded bg-blue-50 text-[#004B87] font-mono border border-blue-200">
                  Block #{blockNumber}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {identity ? identity.fullName : isConnected ? 'Authorized Operator' : 'DecentraX Security Dashboard'}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {identity ? identity.did : account ? `did:decentrax:${account.toLowerCase()}` : 'Connect MetaMask wallet to authenticate with your on-chain credential'}
            </p>
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-md min-w-[130px]">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Identity Status</span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                {identity?.isActive ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-800 text-xs font-bold">Active & Verified</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-800 text-xs font-bold">{isConnected ? 'Unregistered' : 'Disconnected'}</span>
                  </>
                )}
              </div>
            </div>

            {identity?.department && (
              <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-md hidden sm:block max-w-[220px]">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Department</span>
                <span className="text-xs text-slate-800 font-semibold block truncate mt-0.5">
                  {identity.department}
                </span>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-md min-w-[120px]">
              <span className="text-[10px] text-blue-700 uppercase font-semibold block">Current Role</span>
              <span className="text-sm font-bold text-[#004B87] mt-0.5 block">
                {role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary 5-Stage Security Pipeline (IDENTITY ↓ ACCESS ↓ ASSET ↓ VERIFY ↓ AUDIT) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#004B87]" />
              DecentraX Five-Stage Security Lifecycle
            </h3>
            <p className="text-xs text-slate-500">
              Bharat Electronics Limited cryptographic pipeline connecting personnel, permissions, and digital assets.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 hidden sm:inline">
            Smart Contract Enforced
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          <div
            onClick={() => onNavigate('identity')}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-all"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Stage 1</span>
            <span className="font-bold text-slate-800 text-xs block mt-0.5">Identity / DID</span>
            <span className="text-[11px] text-emerald-700 font-medium block mt-1">
              {identity?.isVerified ? '✓ Verified' : 'W3C Standard'}
            </span>
          </div>

          <div
            onClick={() => onNavigate('roles')}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-all"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Stage 2</span>
            <span className="font-bold text-slate-800 text-xs block mt-0.5">Access Control</span>
            <span className="text-[11px] text-blue-700 font-medium block mt-1">
              Role: {role}
            </span>
          </div>

          <div
            onClick={() => onNavigate('assets')}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-all"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Stage 3</span>
            <span className="font-bold text-slate-800 text-xs block mt-0.5">Digital Asset</span>
            <span className="text-[11px] text-amber-700 font-medium block mt-1">
              {totalAssetsCount} ERC-721 Records
            </span>
          </div>

          <div
            onClick={() => onNavigate('verify')}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-all"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Stage 4</span>
            <span className="font-bold text-slate-800 text-xs block mt-0.5">Verification</span>
            <span className="text-[11px] text-purple-700 font-medium block mt-1">
              3-Mode Validator
            </span>
          </div>

          <div
            onClick={() => onNavigate('audit')}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-all col-span-2 md:col-span-1"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Stage 5</span>
            <span className="font-bold text-slate-800 text-xs block mt-0.5">Audit Trail</span>
            <span className="text-[11px] text-emerald-700 font-medium block mt-1">
              Immutable Ledger
            </span>
          </div>
        </div>
      </div>

      {/* 3. Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Registered Identities</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalIdentitiesCount} <span className="text-xs font-normal text-slate-500">Personnel DIDs</span>
          </p>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400">IdentityRegistry.sol</span>
            <button
              onClick={() => onNavigate('identity')}
              className="text-[#004B87] hover:underline font-semibold flex items-center"
            >
              Directory <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Managed Digital Assets</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#004B87] flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalAssetsCount} <span className="text-xs font-normal text-slate-500">ERC-721 Records</span>
          </p>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400">AssetNFT.sol + IPFS</span>
            <button
              onClick={() => onNavigate('assets')}
              className="text-[#004B87] hover:underline font-semibold flex items-center"
            >
              Assets <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">RBAC Roles Active</span>
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            4 <span className="text-xs font-normal text-slate-500">Official Roles</span>
          </p>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400">ADMIN • MGR • AUD • USER</span>
            <button
              onClick={() => onNavigate('roles')}
              className="text-[#004B87] hover:underline font-semibold flex items-center"
            >
              Matrix <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Audit Journal Events</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {recentLogs.length > 0 ? recentLogs.length : '12'}{' '}
            <span className="text-xs font-normal text-slate-500">Logged Events</span>
          </p>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400">DecentraXAuditLogger</span>
            <button
              onClick={() => onNavigate('audit')}
              className="text-[#004B87] hover:underline font-semibold flex items-center"
            >
              Logs <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Two-Column Operational Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3): Role Permissions & Assigned Assets */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Role Permissions Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#004B87]" />
                  Active Permissions for Role: <span className="text-[#004B87] font-extrabold">{role}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Enforced on-chain via smart contract authorization logic (<code className="text-slate-700">DecentraXAccessControl.sol</code>).
                </p>
              </div>
              <button
                onClick={() => onNavigate('verify')}
                className="text-xs font-semibold text-[#004B87] hover:underline"
              >
                Verify Rights →
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {getPermissionsForRole().map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    {item.allowed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <span className={item.allowed ? 'font-medium text-slate-800' : 'text-slate-400'}>
                        {item.perm}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2 font-mono hidden sm:inline">
                        [{item.rule}]
                      </span>
                    </div>
                  </div>
                  <div>
                    {item.allowed ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        PERMITTED
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        RESTRICTED
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned & Managed Digital Assets */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-[#004B87]" />
                  {role === 'USER' ? 'Your Assigned Digital Assets' : 'Managed Defence Assets (ERC-721)'}
                </h3>
                <p className="text-xs text-slate-500">
                  {role === 'USER'
                    ? 'Assets currently under your cryptographic custodial responsibility'
                    : 'Recent traceable defense asset records and custody provenance'}
                </p>
              </div>
              <button
                onClick={() => onNavigate('assets')}
                className="text-xs font-semibold text-[#004B87] hover:underline"
              >
                View All ({totalAssetsCount}) →
              </button>
            </div>

            {(role === 'USER' ? assignedAssets : recentAssets).length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {role === 'USER'
                  ? 'No digital assets currently assigned to your connected wallet.'
                  : 'No digital assets minted yet. Managers can mint assets via Digital Assets tab.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {(role === 'USER' ? assignedAssets : recentAssets).map((asset) => (
                  <div
                    key={asset.tokenId}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">
                          #{asset.tokenId} {asset.assetName}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#004B87] border border-blue-200">
                          {asset.assetType}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {asset.classificationLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Custodian: <span className="text-slate-800">{asset.custodian}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {asset.status}
                      </span>
                      <button
                        onClick={() => onNavigate('assets')}
                        className="text-xs text-[#004B87] hover:bg-blue-50 border border-slate-300 font-medium px-2.5 py-1 rounded bg-white transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3): Navigation & Recent Audit Logs */}
        <div className="space-y-6">
          
          {/* Module Navigation List */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
              Direct Module Navigation
            </h3>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => onNavigate('identity')}
                className="w-full text-left p-2.5 rounded-md bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition-colors flex items-center justify-between text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#004B87]" />
                  <span className="font-semibold">02. Identity / DID Registry</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('roles')}
                className="w-full text-left p-2.5 rounded-md bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition-colors flex items-center justify-between text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-[#004B87]" />
                  <span className="font-semibold">03. Roles & RBAC Matrix</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('assets')}
                className="w-full text-left p-2.5 rounded-md bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition-colors flex items-center justify-between text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <Boxes className="w-4 h-4 text-[#004B87]" />
                  <span className="font-semibold">04. Digital Assets / NFT</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('verify')}
                className="w-full text-left p-2.5 rounded-md bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition-colors flex items-center justify-between text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">05. 3-Mode Verification</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('audit')}
                className="w-full text-left p-2.5 rounded-md bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition-colors flex items-center justify-between text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <FileCheck2 className="w-4 h-4 text-[#004B87]" />
                  <span className="font-semibold">06. Security Audit Trail</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Recent Audit Journal Stream */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Recent Audit Trail Activity
              </h3>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Non-Repudiable
              </span>
            </div>

            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent audit activity recorded.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {recentLogs.map((log) => (
                  <div key={log.id} className="pb-2.5 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-1">{log.details}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span>Operator: {log.operator.substring(0, 8)}...</span>
                      <span className={log.success ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                        {log.success ? '✓ SUCCESS' : '✗ DENIED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
