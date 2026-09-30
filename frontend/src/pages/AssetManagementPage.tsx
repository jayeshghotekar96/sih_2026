import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import {
  Boxes,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  CheckCircle,
  FileText,
  Copy,
  Check,
  AlertTriangle,
  Send,
  Layers,
  Shield,
} from 'lucide-react';
import { contractService } from '../services/contractService';
import { api } from '../services/api';
import { Asset, Identity, Role, AssetType, ClassificationLevel } from '../types';
import { NavigationTab } from '../components/Navigation';
import { ethers } from 'ethers';

interface AssetManagementProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const AssetManagementPage: React.FC<AssetManagementProps> = ({ onNavigate }) => {
  const { account, role, signer, provider, isConnected } = useWeb3();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Mint / Create Asset Modal State
  const [showMintModal, setShowMintModal] = useState(false);
  const [mintName, setMintName] = useState('');
  const [mintType, setMintType] = useState<AssetType>('TACTICAL_HARDWARE');
  const [mintClassification, setMintClassification] = useState<ClassificationLevel>('SECRET');
  const [mintDescription, setMintDescription] = useState('');
  const [mintSerial, setMintSerial] = useState('BEL-HW-2026-');
  const [mintCustodian, setMintCustodian] = useState('');
  const [mintSpecs, setMintSpecs] = useState('Frequency: 8.5-10.5 GHz\nEncryption: 256-bit AES Cryptographic Core\nInterface: MIL-STD-1553B');
  const [isMinting, setIsMinting] = useState(false);
  const [mintStep, setMintStep] = useState<number>(0);
  const [mintError, setMintError] = useState<string | null>(null);

  // Allocation / Transfer Modal State
  const [selectedAssetForAlloc, setSelectedAssetForAlloc] = useState<Asset | null>(null);
  const [newCustodian, setNewCustodian] = useState('');
  const [allocRemarks, setAllocRemarks] = useState('');
  const [isAllocating, setIsAllocating] = useState(false);

  // Audit Attestation Modal State
  const [selectedAssetForAudit, setSelectedAssetForAudit] = useState<Asset | null>(null);
  const [auditRemarks, setAuditRemarks] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);

  // Details & IPFS Dossier Modal
  const [inspectAsset, setInspectAsset] = useState<Asset | null>(null);
  const [inspectMetadata, setInspectMetadata] = useState<any | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  const loadData = async () => {
    if (!provider) return;
    try {
      setIsLoading(true);
      const [allAssets, allIdentities] = await Promise.all([
        contractService.getAllAssets(provider),
        contractService.getAllIdentities(provider),
      ]);
      setAssets(allAssets);
      setIdentities(allIdentities);
      if (allIdentities.length > 0 && !mintCustodian) {
        setMintCustodian(allIdentities[0].wallet);
      }
    } catch (err) {
      console.warn('Failed to load digital assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [provider]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Full Minting Lifecycle: CREATE → MINT → IPFS → ON-CHAIN → AUDIT
  const handleMintAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) {
      setMintError('Please connect an authorized wallet.');
      return;
    }

    if (role !== 'MANAGER' && role !== 'ADMIN') {
      setMintError('Access Denied: Only MANAGER or ADMIN role can mint digital assets.');
      return;
    }

    if (!ethers.isAddress(mintCustodian)) {
      setMintError('Invalid custodian Ethereum wallet address.');
      return;
    }

    try {
      setIsMinting(true);
      setMintError(null);

      // Step 1: Upload technical dossier to IPFS
      setMintStep(1);
      const metadataPayload = {
        name: mintName,
        assetType: mintType,
        classificationLevel: mintClassification,
        description: mintDescription,
        serialNumber: mintSerial,
        specifications: mintSpecs,
        manufacturer: 'Bharat Electronics Limited (BEL)',
        mintedBy: account,
        initialCustodian: mintCustodian,
        createdAt: new Date().toISOString(),
      };

      const ipfsRes = await api.uploadMetadata(metadataPayload);
      const metadataCID = ipfsRes.cid;

      // Step 2: Request MetaMask ERC-721 Mint Transaction
      setMintStep(2);
      const { txHash, tokenId } = await contractService.mintAsset(
        mintName,
        mintType,
        mintDescription,
        metadataCID,
        mintClassification,
        mintCustodian,
        signer
      );

      // Step 3: Confirmation and Audit Logging
      setMintStep(3);
      await api.logAudit({
        category: 'ASSET',
        action: 'ASSET_MINTED',
        operator: account || '',
        subject: mintCustodian,
        resourceId: `ASSET_${tokenId}`,
        details: `Minted ERC-721 asset #${tokenId} (${mintName}, ${mintType}, ${mintClassification}) with IPFS CID: ${metadataCID}`,
        txHash,
        success: true,
      });

      setMintStep(4);
      setShowMintModal(false);
      setMintName('');
      setMintDescription('');
      await loadData();
    } catch (err: any) {
      setMintError(err.reason || err.message || 'Failed to mint asset.');
    } finally {
      setIsMinting(false);
      setMintStep(0);
    }
  };

  // Custody Reallocation: ALLOCATE / TRANSFER
  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !selectedAssetForAlloc) return;

    if (!ethers.isAddress(newCustodian)) {
      alert('Invalid recipient wallet address');
      return;
    }

    try {
      setIsAllocating(true);
      const { txHash } = await contractService.allocateAsset(
        selectedAssetForAlloc.tokenId,
        newCustodian,
        allocRemarks || 'Transferred custody to authorized defence personnel',
        signer
      );

      await api.logAudit({
        category: 'ASSET',
        action: 'ASSET_ALLOCATED',
        operator: account || '',
        subject: newCustodian,
        resourceId: `ASSET_${selectedAssetForAlloc.tokenId}`,
        details: `Reassigned custody of #${selectedAssetForAlloc.tokenId} (${selectedAssetForAlloc.assetName}) to ${newCustodian}. Remarks: ${allocRemarks}`,
        txHash,
        success: true,
      });

      alert(`Asset #${selectedAssetForAlloc.tokenId} custody successfully allocated on-chain!`);
      setSelectedAssetForAlloc(null);
      setNewCustodian('');
      setAllocRemarks('');
      await loadData();
    } catch (err: any) {
      alert(err.reason || err.message || 'Failed to allocate custody');
    } finally {
      setIsAllocating(false);
    }
  };

  // Attest / Audit Asset
  const handleAuditAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !selectedAssetForAudit) return;

    try {
      setIsAuditing(true);
      const { txHash } = await contractService.auditAsset(
        selectedAssetForAudit.tokenId,
        true,
        auditRemarks || 'Technical integrity, tamper seals, and serial verified by Auditor',
        signer
      );

      await api.logAudit({
        category: 'ASSET',
        action: 'ASSET_AUDITED',
        operator: account || '',
        subject: selectedAssetForAudit.custodian,
        resourceId: `ASSET_${selectedAssetForAudit.tokenId}`,
        details: `Audited asset #${selectedAssetForAudit.tokenId} (${selectedAssetForAudit.assetName}). Notes: ${auditRemarks}`,
        txHash,
        success: true,
      });

      alert(`Asset #${selectedAssetForAudit.tokenId} audited and recorded on-chain!`);
      setSelectedAssetForAudit(null);
      setAuditRemarks('');
      await loadData();
    } catch (err: any) {
      alert(err.reason || err.message || 'Failed to submit audit');
    } finally {
      setIsAuditing(false);
    }
  };

  // View / Inspect IPFS metadata
  const handleInspect = async (asset: Asset) => {
    setInspectAsset(asset);
    setLoadingMetadata(true);
    try {
      const meta = await api.fetchMetadata(asset.metadataCID);
      setInspectMetadata(meta);
    } catch (err) {
      setInspectMetadata(null);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.custodian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.metadataCID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(asset.tokenId).includes(searchQuery);

    if (typeFilter !== 'ALL') {
      return matchesSearch && asset.assetType === typeFilter;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Digital Assets / NFT Management
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-[#004B87] border border-blue-200">
              ERC-721 On-Chain Custody
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Cryptographic custody, provenance tracking, and immutable lifecycle records for Bharat Electronics Limited digital assets. Anchored to IPFS dossiers and polygon blockchain tokens.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {(role === 'MANAGER' || role === 'ADMIN') && (
            <button
              onClick={() => {
                setShowMintModal(true);
                setMintError(null);
              }}
              className="decentra-btn-primary flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Ingest / Mint Asset</span>
            </button>
          )}

          <button
            onClick={loadData}
            disabled={isLoading}
            className="decentra-btn-secondary flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Asset Lifecycle Visual Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#004B87]" />
            Asset Lifecycle Pipeline
          </span>
          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
            Smart Contract Enforced
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-center text-xs font-semibold">
          <div className="bg-slate-50 border border-slate-200 py-1.5 px-1 rounded text-slate-700">1. CREATE</div>
          <div className="bg-slate-50 border border-slate-200 py-1.5 px-1 rounded text-blue-700">2. MINT</div>
          <div className="bg-slate-50 border border-slate-200 py-1.5 px-1 rounded text-indigo-700">3. ALLOCATE</div>
          <div className="bg-slate-50 border border-slate-200 py-1.5 px-1 rounded text-amber-700">4. ACCESS</div>
          <div className="bg-slate-50 border border-slate-200 py-1.5 px-1 rounded text-purple-700">5. TRANSFER</div>
          <div className="bg-slate-50 border border-slate-200 py-1.5 px-1 rounded text-emerald-700">6. VERIFY</div>
          <div className="bg-slate-50 border border-slate-200 py-1.5 px-1 rounded text-slate-600">7. AUDIT</div>
        </div>
      </div>

      {/* Legal & Physical Asset Ownership Clarification Notice */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3.5 flex items-start space-x-3 text-xs text-amber-900 shadow-2xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Physical Asset Verification Note:</strong> DecentraX ERC-721 token issuance establishes cryptographic custody, provenance tracking, and immutable lifecycle history on-chain. Physical custody handover and legal asset disposition remain governed in accordance with Bharat Electronics Limited enterprise SOPs.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Asset Name, Token ID, Custodian, or CID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 font-medium w-full sm:w-auto focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Asset Types</option>
            <option value="TACTICAL_HARDWARE">Tactical Hardware</option>
            <option value="CRYPTO_KEYPAIR">Crypto Keypair</option>
            <option value="DEFENCE_DOCUMENT">Defence Document</option>
            <option value="COMMUNICATION_CODE">Communication Code</option>
            <option value="SURVEILLANCE_SYSTEM">Surveillance System</option>
            <option value="RADAR_SYSTEM">Radar System</option>
            <option value="DRONE_FIRMWARE">Drone Firmware</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400 text-xs shadow-xs">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#004B87]" />
              <span>Querying AssetNFT smart contract state...</span>
            </div>
          ) : (
            'No digital defence assets found matching the query criteria.'
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.tokenId}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all"
            >
              <div>
                {/* Header Tag Bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-[#004B87] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono">
                      NFT #{asset.tokenId}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {asset.assetType}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                      asset.classificationLevel === 'TOP_SECRET'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : asset.classificationLevel === 'SECRET'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {asset.classificationLevel}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-1">{asset.assetName}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {asset.description}
                </p>

                {/* Field Details */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Owner / Custodian:
                    </span>
                    <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-700">
                      <span className="truncate max-w-[200px]">{asset.custodian}</span>
                      <button
                        onClick={() => copyToClipboard(asset.custodian)}
                        className="text-slate-400 hover:text-slate-700"
                        title="Copy Custodian Address"
                      >
                        {copiedText === asset.custodian ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      IPFS Metadata CID:
                    </span>
                    <div className="flex items-center space-x-1.5 font-mono text-[11px] text-[#004B87]">
                      <span className="truncate max-w-[200px]">{asset.metadataCID}</span>
                      <button
                        onClick={() => copyToClipboard(asset.metadataCID)}
                        className="text-slate-400 hover:text-slate-700"
                        title="Copy CID"
                      >
                        {copiedText === asset.metadataCID ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Status:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {asset.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Created:</span>
                    <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: VIEW | ALLOCATE / TRANSFER | AUDIT | VERIFY */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleInspect(asset)}
                    className="px-2.5 py-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium flex items-center space-x-1 transition-colors"
                  >
                    <FileText className="w-3 h-3 text-[#004B87]" />
                    <span>Dossier</span>
                  </button>

                  <button
                    onClick={() => onNavigate('verify')}
                    className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-medium flex items-center space-x-1 transition-colors"
                    title="Verify on Blockchain"
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Verify</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
                  {(role === 'MANAGER' || role === 'ADMIN') && (
                    <button
                      onClick={() => {
                        setSelectedAssetForAlloc(asset);
                        setNewCustodian('');
                        setAllocRemarks('');
                      }}
                      className="px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-[#004B87] border border-blue-200 rounded font-medium transition-colors"
                    >
                      Allocate
                    </button>
                  )}

                  {(role === 'AUDITOR' || role === 'ADMIN') && (
                    <button
                      onClick={() => {
                        setSelectedAssetForAudit(asset);
                        setAuditRemarks('');
                      }}
                      className="px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded font-medium transition-colors"
                    >
                      Audit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / MINT MODAL */}
      {showMintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-[#004B87]" />
                <h3 className="text-base font-bold text-slate-900">
                  Ingest & Mint Digital Asset (ERC-721)
                </h3>
              </div>
              <button
                onClick={() => !isMinting && setShowMintModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMintAsset} className="space-y-4 mt-4 text-xs">
              {mintError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800">
                  {mintError}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Asset Title / Military Designation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BFSR-SR Battle Field Surveillance Radar"
                  value={mintName}
                  onChange={(e) => setMintName(e.target.value)}
                  className="decentra-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Asset Category *
                  </label>
                  <select
                    value={mintType}
                    onChange={(e) => setMintType(e.target.value as AssetType)}
                    className="decentra-input"
                  >
                    <option value="TACTICAL_HARDWARE">Tactical Hardware</option>
                    <option value="CRYPTO_KEYPAIR">Crypto Keypair</option>
                    <option value="DEFENCE_DOCUMENT">Defence Document</option>
                    <option value="COMMUNICATION_CODE">Communication Code</option>
                    <option value="SURVEILLANCE_SYSTEM">Surveillance System</option>
                    <option value="RADAR_SYSTEM">Radar System</option>
                    <option value="DRONE_FIRMWARE">Drone Firmware</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Security Classification *
                  </label>
                  <select
                    value={mintClassification}
                    onChange={(e) => setMintClassification(e.target.value as ClassificationLevel)}
                    className="decentra-input"
                  >
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="SECRET">SECRET</option>
                    <option value="TOP_SECRET">TOP_SECRET</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Initial Custodian Wallet (ERC-721 Recipient) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={mintCustodian}
                  onChange={(e) => setMintCustodian(e.target.value)}
                  className="decentra-input font-mono"
                />
                {identities.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="text-[10px] text-slate-500 self-center">Personnel:</span>
                    {identities.slice(0, 3).map((id) => (
                      <button
                        key={id.wallet}
                        type="button"
                        onClick={() => setMintCustodian(id.wallet)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-300 px-1.5 py-0.5 rounded text-slate-700"
                      >
                        {id.fullName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Hardware Serial / Dossier Code *
                </label>
                <input
                  type="text"
                  required
                  value={mintSerial}
                  onChange={(e) => setMintSerial(e.target.value)}
                  className="decentra-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Technical Specifications & Dossier Payload
                </label>
                <textarea
                  rows={3}
                  value={mintSpecs}
                  onChange={(e) => setMintSpecs(e.target.value)}
                  className="decentra-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Operational Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short operational summary of the asset..."
                  value={mintDescription}
                  onChange={(e) => setMintDescription(e.target.value)}
                  className="decentra-input"
                />
              </div>

              {isMinting && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs space-y-1">
                  <div className="text-[#004B87] font-semibold flex items-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Asset Lifecycle Pipeline...</span>
                  </div>
                  <div className="text-[11px] text-slate-600 pl-5">
                    {mintStep === 1 && '1/3 Generating & pinning metadata to IPFS...'}
                    {mintStep === 2 && '2/3 Submitting AssetNFT.mintAsset() to blockchain...'}
                    {mintStep === 3 && '3/3 Recording immutable audit trail entry...'}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowMintModal(false)}
                  disabled={isMinting}
                  className="decentra-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMinting || !mintName || !mintCustodian}
                  className="decentra-btn-primary text-xs flex items-center space-x-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Execute Minting</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALLOCATION / TRANSFER MODAL */}
      {selectedAssetForAlloc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-lg p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Reallocate Asset Custody (#{selectedAssetForAlloc.tokenId})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Transfer cryptographic custody of <strong>{selectedAssetForAlloc.assetName}</strong> to another verified personnel identity.
            </p>

            <form onSubmit={handleAllocate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Custodian (Wallet Address) *
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newCustodian}
                  onChange={(e) => setNewCustodian(e.target.value)}
                  required
                  className="decentra-input font-mono"
                />
                {identities.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="text-[10px] text-slate-500 self-center">Personnel:</span>
                    {identities.slice(0, 3).map((id) => (
                      <button
                        key={id.wallet}
                        type="button"
                        onClick={() => setNewCustodian(id.wallet)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-300 px-1.5 py-0.5 rounded text-slate-700"
                      >
                        {id.fullName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transfer Remarks / Authority Order Order
                </label>
                <textarea
                  rows={3}
                  value={allocRemarks}
                  onChange={(e) => setAllocRemarks(e.target.value)}
                  placeholder="e.g. Reassigned to Radar Operations Unit for scheduled technical deployment."
                  className="decentra-input"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedAssetForAlloc(null)}
                  className="decentra-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAllocating || !newCustodian}
                  className="decentra-btn-primary text-xs flex items-center space-x-1.5"
                >
                  {isAllocating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transacting...</span>
                    </>
                  ) : (
                    <span>Confirm Allocation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDITOR ATTESTATION MODAL */}
      {selectedAssetForAudit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-lg p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Attest Asset Integrity (#{selectedAssetForAudit.tokenId})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Cryptographic auditor attestation for <strong>{selectedAssetForAudit.assetName}</strong>.
            </p>

            <form onSubmit={handleAuditAsset} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Inspection Findings & Cryptographic Checks *
                </label>
                <textarea
                  rows={4}
                  value={auditRemarks}
                  onChange={(e) => setAuditRemarks(e.target.value)}
                  placeholder="e.g. Serial verified against physical chassis. IPFS metadata cryptographic checksums confirmed valid. Tamper seals verified intact."
                  required
                  className="decentra-input"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedAssetForAudit(null)}
                  className="decentra-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAuditing}
                  className="px-4 py-2 text-xs bg-purple-700 hover:bg-purple-800 text-white rounded font-medium flex items-center space-x-1.5 shadow-xs"
                >
                  {isAuditing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Confirm On-Chain Attestation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT IPFS METADATA MODAL */}
      {inspectAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-[#004B87]" />
                <h3 className="text-base font-bold text-slate-900">
                  #{inspectAsset.tokenId} {inspectAsset.assetName} — IPFS Dossier
                </h3>
              </div>
              <button
                onClick={() => setInspectAsset(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">NFT Token ID</span>
                  <span className="font-bold text-[#004B87] font-mono">#{inspectAsset.tokenId} (ERC-721)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Classification</span>
                  <span className="font-bold text-amber-800">{inspectAsset.classificationLevel}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Blockchain Custodian</span>
                  <span className="text-slate-800 truncate block font-mono">{inspectAsset.custodian}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">IPFS CID</span>
                  <span className="text-slate-800 truncate block font-mono">{inspectAsset.metadataCID}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-1">
                  Decentralized Metadata Payload (IPFS JSON):
                </h4>
                {loadingMetadata ? (
                  <div className="p-8 text-center text-slate-400 font-mono">
                    Fetching content from IPFS Pinata gateway...
                  </div>
                ) : inspectMetadata ? (
                  <pre className="p-4 bg-slate-900 text-sky-300 rounded-md font-mono text-[11px] overflow-x-auto leading-relaxed max-h-64 border border-slate-800">
                    {JSON.stringify(inspectMetadata, null, 2)}
                  </pre>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 text-slate-700 rounded-md">
                    Metadata cached at local IPFS CID: <code className="text-[#004B87]">{inspectAsset.metadataCID}</code>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <button
                  onClick={() => {
                    setInspectAsset(null);
                    onNavigate('verify');
                  }}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-semibold text-xs flex items-center space-x-1"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verify this Asset in Verification Suite</span>
                </button>

                <button onClick={() => setInspectAsset(null)} className="decentra-btn-primary text-xs">
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
