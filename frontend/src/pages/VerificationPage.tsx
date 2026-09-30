import React, { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  ExternalLink,
  Shield,
  Boxes,
  Users,
  Lock,
  Copy,
  Check,
  Cpu,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import { contractService } from '../services/contractService';
import { api } from '../services/api';
import { Identity, Asset, Role } from '../types';
import { DEMO_ACCOUNTS } from '../components/DemoSwitcher';

export type VerificationMode = 'IDENTITY' | 'ASSET' | 'ACCESS';

export const VerificationPage: React.FC = () => {
  const { provider, signer, account } = useWeb3();

  const [activeMode, setActiveMode] = useState<VerificationMode>('IDENTITY');

  // Input states
  const [walletInput, setWalletInput] = useState<string>('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  const [assetIdInput, setAssetIdInput] = useState<string>('1');
  const [accessAccountInput, setAccessAccountInput] = useState<string>('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  const [accessResource, setAccessResource] = useState<string>('TACTICAL_HARDWARE');
  const [accessAction, setAccessAction] = useState<string>('CREATE_ASSET');

  // Result states
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Identity Result
  const [identityResult, setIdentityResult] = useState<{
    status: 'VERIFIED' | 'INVALID';
    identity?: Identity;
    heldAssets?: Asset[];
    reason?: string;
    verifiedAt: string;
  } | null>(null);

  // Asset Result
  const [assetResult, setAssetResult] = useState<{
    status: 'VERIFIED' | 'INVALID';
    asset?: Asset;
    ipfsMetadata?: any;
    reason?: string;
    verifiedAt: string;
  } | null>(null);

  // Access Result
  const [accessResult, setAccessResult] = useState<{
    status: 'ALLOW' | 'ACCESS_DENIED' | 'INVALID';
    granted: boolean;
    detectedRole: string;
    reason: string;
    account: string;
    resource: string;
    action: string;
    verifiedAt: string;
  } | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // --- 1. Identity Verification ---
  const handleVerifyIdentity = async (customWallet?: string) => {
    const target = customWallet || walletInput;
    if (!provider || !target) return;

    try {
      setIsVerifying(true);
      setIdentityResult(null);

      const id = await contractService.getIdentity(target, provider);
      if (id && id.wallet && id.wallet !== '0x0000000000000000000000000000000000000000') {
        const allAssets = await contractService.getAllAssets(provider).catch(() => []);
        const held = allAssets.filter(
          (a) => a.custodian.toLowerCase() === target.toLowerCase()
        );

        setIdentityResult({
          status: 'VERIFIED',
          identity: id,
          heldAssets: held,
          verifiedAt: new Date().toLocaleTimeString(),
        });

        await api.logAudit({
          category: 'SECURITY',
          action: 'IDENTITY_VERIFIED',
          operator: account || target,
          subject: target,
          resourceId: id.did,
          details: `Decentralized identity ${id.fullName} verified on-chain`,
          txHash: null,
          success: true,
        });
      } else {
        setIdentityResult({
          status: 'INVALID',
          reason: `Wallet address ${target} is not registered in the IdentityRegistry contract.`,
          verifiedAt: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setIdentityResult({
        status: 'INVALID',
        reason: err.message || 'On-chain verification query failed.',
        verifiedAt: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // --- 2. Asset Verification ---
  const handleVerifyAsset = async (customTokenId?: string) => {
    const target = customTokenId || assetIdInput;
    const tokenId = Number(target);
    if (!provider || isNaN(tokenId) || tokenId <= 0) return;

    try {
      setIsVerifying(true);
      setAssetResult(null);

      const asset = await contractService.getAsset(tokenId, provider);
      if (asset) {
        let ipfsData = null;
        if (asset.metadataCID) {
          try {
            ipfsData = await api.fetchMetadata(asset.metadataCID);
          } catch (e) {
            console.warn('IPFS fetch failed:', e);
          }
        }

        setAssetResult({
          status: 'VERIFIED',
          asset,
          ipfsMetadata: ipfsData,
          verifiedAt: new Date().toLocaleTimeString(),
        });

        await api.logAudit({
          category: 'SECURITY',
          action: 'ASSET_VERIFIED',
          operator: account || '',
          subject: asset.custodian,
          resourceId: `ASSET_${asset.tokenId}`,
          details: `Digital asset #${asset.tokenId} (${asset.assetName}) verified with metadata CID ${asset.metadataCID}`,
          txHash: null,
          success: true,
        });
      } else {
        setAssetResult({
          status: 'INVALID',
          reason: `Token ID #${tokenId} does not exist on the AssetNFT contract.`,
          verifiedAt: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setAssetResult({
        status: 'INVALID',
        reason: err.message || 'Asset verification failed on-chain.',
        verifiedAt: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // --- 3. Access Verification ---
  const handleVerifyAccess = async () => {
    const targetAccount = accessAccountInput.trim();
    const targetResource = accessResource;
    const targetAction = accessAction;

    if (!provider || !targetAccount) return;

    try {
      setIsVerifying(true);
      setAccessResult(null);
      const runner = signer || provider;

      const detectedRole = await contractService.getRole(targetAccount, runner);
      const { granted, reason } = await contractService.evaluateAccess(
        targetAccount,
        targetResource,
        targetAction,
        runner
      );

      setAccessResult({
        status: granted ? 'ALLOW' : 'ACCESS_DENIED',
        granted,
        detectedRole,
        reason,
        account: targetAccount,
        resource: targetResource,
        action: targetAction,
        verifiedAt: new Date().toLocaleTimeString(),
      });

      await api.logAudit({
        category: 'ACCESS',
        action: 'ACCESS_EVALUATED',
        operator: account || targetAccount,
        subject: targetAccount,
        resourceId: targetResource,
        details: `Access check for ${targetAction} on ${targetResource} -> ${granted ? 'ALLOW' : 'DENY'} (${reason})`,
        txHash: null,
        success: granted,
      });
    } catch (err: any) {
      setAccessResult({
        status: 'INVALID',
        granted: false,
        detectedRole: 'UNASSIGNED',
        reason: err.message || 'Failed to simulate access check on-chain.',
        account: targetAccount,
        resource: targetResource,
        action: targetAction,
        verifiedAt: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Cryptographic Verification Suite
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Module 05
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Three-mode cryptographic validator verifying decentralized identities, digital asset provenance, and smart-contract access rules.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200">
            <button
              onClick={() => setActiveMode('IDENTITY')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeMode === 'IDENTITY'
                  ? 'bg-[#004B87] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Identity Verification
            </button>
            <button
              onClick={() => setActiveMode('ASSET')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeMode === 'ASSET'
                  ? 'bg-[#004B87] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Asset Verification
            </button>
            <button
              onClick={() => setActiveMode('ACCESS')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeMode === 'ACCESS'
                  ? 'bg-[#004B87] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Access (RBAC)
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: IDENTITY VERIFICATION */}
      {activeMode === 'IDENTITY' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-[#004B87]" />
              <h3 className="font-bold text-base text-slate-900">
                Mode 1: Decentralized Identity (DID) Verification
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Cryptographic pipeline: <code className="text-[#004B87] font-semibold">Wallet → DID Reference → Blockchain Record → Status</code>
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleVerifyIdentity(); }} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter Wallet Address to Verify:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={walletInput}
                    onChange={(e) => setWalletInput(e.target.value)}
                    placeholder="0x..."
                    className="decentra-input font-mono"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="decentra-btn-primary min-w-[140px]"
                  >
                    {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify On-Chain'}
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                <span className="text-slate-500 font-medium">Quick Presets:</span>
                {DEMO_ACCOUNTS.map((persona) => (
                  <button
                    key={persona.role}
                    type="button"
                    onClick={() => {
                      setWalletInput(persona.address);
                      handleVerifyIdentity(persona.address);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-colors"
                  >
                    {persona.name} ({persona.role})
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Identity Verification Result */}
          {identityResult && (
            <div className={`bg-white border rounded-lg p-6 shadow-sm ${
              identityResult.status === 'VERIFIED' ? 'border-emerald-300' : 'border-rose-300'
            }`}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  {identityResult.status === 'VERIFIED' ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <span className={`text-base font-extrabold tracking-wide ${
                      identityResult.status === 'VERIFIED' ? 'text-emerald-800' : 'text-rose-800'
                    }`}>
                      {identityResult.status === 'VERIFIED' ? 'IDENTITY VERIFIED — CRYPTOGRAPHIC PROOF VALID' : 'VERIFICATION FAILED — IDENTITY NOT FOUND'}
                    </span>
                    <p className="text-xs text-slate-500">
                      Query executed at {identityResult.verifiedAt} against Polygon Amoy IdentityRegistry
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded text-xs font-bold border ${
                  identityResult.status === 'VERIFIED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  {identityResult.status}
                </span>
              </div>

              {identityResult.status === 'VERIFIED' && identityResult.identity ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-500 uppercase block text-[10px] font-semibold">Personnel Name</span>
                      <span className="font-bold text-slate-900 text-sm">{identityResult.identity.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase block text-[10px] font-semibold">Department</span>
                      <span className="font-semibold text-slate-800">{identityResult.identity.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase block text-[10px] font-semibold">On-Chain Role</span>
                      <span className="inline-block px-2 py-0.5 rounded font-bold text-xs bg-blue-50 text-[#004B87] border border-blue-200 mt-0.5">
                        {identityResult.identity.role}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-500 uppercase block text-[10px] font-semibold">W3C DID Reference</span>
                      <span className="font-mono text-slate-800 font-semibold">{identityResult.identity.did}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase block text-[10px] font-semibold">Credential State</span>
                      <span className="font-semibold text-emerald-700">
                        {identityResult.identity.isActive ? 'Active & Verifiable' : 'Suspended'}
                      </span>
                    </div>
                  </div>

                  {identityResult.heldAssets && identityResult.heldAssets.length > 0 && (
                    <div className="pt-2">
                      <h4 className="font-bold text-slate-800 text-xs mb-2">
                        Traceable Digital Assets Currently Held ({identityResult.heldAssets.length}):
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {identityResult.heldAssets.map((asset) => (
                          <div key={asset.tokenId} className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-800">#{asset.tokenId} {asset.assetName}</span>
                              <span className="block text-[10px] text-slate-500 font-mono">CID: {asset.metadataCID.substring(0, 18)}...</span>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {asset.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs">
                  {identityResult.reason}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: ASSET VERIFICATION */}
      {activeMode === 'ASSET' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center space-x-2 mb-2">
              <Boxes className="w-5 h-5 text-[#004B87]" />
              <h3 className="font-bold text-base text-slate-900">
                Mode 2: Digital Asset & NFT Provenance Verification
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Cryptographic pipeline: <code className="text-[#004B87] font-semibold">Asset ID → NFT Token → Custodian → Metadata CID → Blockchain Record</code>
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleVerifyAsset(); }} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter ERC-721 Token ID to Verify:
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={assetIdInput}
                    onChange={(e) => setAssetIdInput(e.target.value)}
                    placeholder="e.g. 1"
                    className="decentra-input max-w-[200px]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="decentra-btn-primary min-w-[140px]"
                  >
                    {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify Asset'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Quick Tokens:</span>
                {[1, 2, 3].map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setAssetIdInput(String(id));
                      handleVerifyAsset(String(id));
                    }}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700"
                  >
                    Token #{id}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Asset Result */}
          {assetResult && (
            <div className={`bg-white border rounded-lg p-6 shadow-sm ${
              assetResult.status === 'VERIFIED' ? 'border-emerald-300' : 'border-rose-300'
            }`}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  {assetResult.status === 'VERIFIED' ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <span className={`text-base font-extrabold tracking-wide ${
                      assetResult.status === 'VERIFIED' ? 'text-emerald-800' : 'text-rose-800'
                    }`}>
                      {assetResult.status === 'VERIFIED' ? 'ASSET VERIFIED — ERC-721 ON-CHAIN RECORD VALID' : 'VERIFICATION FAILED — TOKEN NOT FOUND'}
                    </span>
                    <p className="text-xs text-slate-500">
                      Query executed at {assetResult.verifiedAt} against AssetNFT contract
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded text-xs font-bold border ${
                  assetResult.status === 'VERIFIED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  {assetResult.status}
                </span>
              </div>

              {assetResult.status === 'VERIFIED' && assetResult.asset ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-500 uppercase block text-[10px] font-semibold">Asset Title</span>
                      <span className="font-bold text-slate-900 text-sm">#{assetResult.asset.tokenId} {assetResult.asset.assetName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase block text-[10px] font-semibold">Category & Clearance</span>
                      <span className="font-semibold text-slate-800">{assetResult.asset.assetType} ({assetResult.asset.classificationLevel})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase block text-[10px] font-semibold">Custody Status</span>
                      <span className="font-bold text-emerald-800">{assetResult.asset.status}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-500 uppercase block text-[10px] font-semibold">Current Custodian Address</span>
                      <span className="font-mono text-slate-800 font-semibold">{assetResult.asset.custodian}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase block text-[10px] font-semibold">IPFS Metadata CID</span>
                      <span className="font-mono text-[#004B87] font-semibold">{assetResult.asset.metadataCID}</span>
                    </div>
                  </div>

                  {assetResult.ipfsMetadata && (
                    <div className="p-3 bg-slate-900 text-sky-300 rounded font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                      <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">// Pinata IPFS Decentralized Technical Dossier:</div>
                      {JSON.stringify(assetResult.ipfsMetadata, null, 2)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs">
                  {assetResult.reason}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 3: ACCESS VERIFICATION */}
      {activeMode === 'ACCESS' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center space-x-2 mb-2">
              <Lock className="w-5 h-5 text-[#004B87]" />
              <h3 className="font-bold text-base text-slate-900">
                Mode 3: Access Control & Authorization Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Cryptographic pipeline: <code className="text-[#004B87] font-semibold">Wallet → Role → Permission → evaluateAccess.staticCall() → ALLOW / DENY</code>
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleVerifyAccess(); }} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Subject Wallet Address *
                  </label>
                  <input
                    type="text"
                    value={accessAccountInput}
                    onChange={(e) => setAccessAccountInput(e.target.value)}
                    placeholder="0x..."
                    className="decentra-input font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Resource Type *
                  </label>
                  <select
                    value={accessResource}
                    onChange={(e) => setAccessResource(e.target.value)}
                    className="decentra-input"
                  >
                    <option value="TACTICAL_HARDWARE">Tactical Hardware</option>
                    <option value="CRYPTO_KEYPAIR">Crypto Keypair</option>
                    <option value="DEFENCE_DOCUMENT">Defence Document</option>
                    <option value="IDENTITY_REGISTRY">Identity Registry</option>
                    <option value="AUDIT_LOGS">Audit Logs Enclave</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Requested Action *
                  </label>
                  <select
                    value={accessAction}
                    onChange={(e) => setAccessAction(e.target.value)}
                    className="decentra-input"
                  >
                    <option value="CREATE_ASSET">CREATE_ASSET (Mint)</option>
                    <option value="ALLOCATE_ASSET">ALLOCATE_ASSET (Transfer)</option>
                    <option value="AUDIT_INSPECT">AUDIT_INSPECT (Verify)</option>
                    <option value="REGISTER_IDENTITY">REGISTER_IDENTITY (Admin)</option>
                    <option value="VIEW_ASSET">VIEW_ASSET (Read)</option>
                  </select>
                </div>
              </div>

              {/* Quick Persona Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Test Personas:</span>
                {DEMO_ACCOUNTS.map((persona) => (
                  <button
                    key={persona.role}
                    type="button"
                    onClick={() => setAccessAccountInput(persona.address)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700"
                  >
                    {persona.name} ({persona.role})
                  </button>
                ))}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="decentra-btn-primary min-w-[170px]"
                >
                  {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Evaluate Access Policy'}
                </button>
              </div>
            </form>
          </div>

          {/* Access Result */}
          {accessResult && (
            <div className={`bg-white border rounded-lg p-6 shadow-sm ${
              accessResult.status === 'ALLOW' ? 'border-emerald-300' : 'border-rose-300'
            }`}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  {accessResult.status === 'ALLOW' ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <span className={`text-base font-extrabold tracking-wide ${
                      accessResult.status === 'ALLOW' ? 'text-emerald-800' : 'text-rose-800'
                    }`}>
                      {accessResult.status === 'ALLOW' ? 'ACCESS GRANTED — ACTION PERMITTED BY SMART CONTRACT' : 'ACCESS DENIED — UNAUTHORIZED POLICY VIOLATION'}
                    </span>
                    <p className="text-xs text-slate-500">
                      Evaluated at {accessResult.verifiedAt} via DecentraXAccessControl.evaluateAccess()
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded text-xs font-bold border ${
                  accessResult.status === 'ALLOW'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  {accessResult.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 uppercase block text-[10px] font-semibold">Subject Account</span>
                  <span className="font-mono text-slate-800 font-semibold truncate block">{accessResult.account}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block text-[10px] font-semibold">Detected On-Chain Role</span>
                  <span className="font-bold text-[#004B87] block mt-0.5">{accessResult.detectedRole}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block text-[10px] font-semibold">Requested Operation</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">{accessResult.action} on {accessResult.resource}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block text-[10px] font-semibold">Contract Policy Reason</span>
                  <span className={`font-semibold block mt-0.5 ${accessResult.granted ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {accessResult.reason}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
