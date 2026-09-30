import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import {
  PlusCircle,
  Boxes,
  Database,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Shield,
  FileText,
  Upload,
} from 'lucide-react';
import { contractService } from '../services/contractService';
import { api } from '../services/api';
import { AssetType, ClassificationLevel, Identity } from '../types';
import { NavigationTab } from '../components/Navigation';
import { ethers } from 'ethers';

interface MintAssetPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const MintAssetPage: React.FC<MintAssetPageProps> = ({ onNavigate }) => {
  const { account, role, signer, provider, isConnected } = useWeb3();

  const [identities, setIdentities] = useState<Identity[]>([]);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('TACTICAL_HARDWARE');
  const [classificationLevel, setClassificationLevel] = useState<ClassificationLevel>('SECRET');
  const [description, setDescription] = useState('');
  const [serialNumber, setSerialNumber] = useState('BEL-HW-2026-');
  const [custodianAddress, setCustodianAddress] = useState('');
  const [specs, setSpecs] = useState('Frequency: 8.5-10.5 GHz\nEncryption: 256-bit AES Cryptographic Core\nInterface: MIL-STD-1553B');

  // Step Progress State
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [isMinting, setIsMinting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mintResult, setMintResult] = useState<{
    tokenId: number;
    cid: string;
    txHash: string;
  } | null>(null);

  useEffect(() => {
    const loadIdentities = async () => {
      if (!provider) return;
      try {
        const list = await contractService.getAllIdentities(provider);
        setIdentities(list);
        if (list.length > 0 && !custodianAddress) {
          setCustodianAddress(list[0].wallet);
        }
      } catch (err) {
        console.warn('Failed to load identities for minting:', err);
      }
    };
    loadIdentities();
  }, [provider]);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) {
      setErrorMsg('Please connect an authorized wallet.');
      return;
    }

    if (role !== 'MANAGER' && role !== 'ADMIN') {
      setErrorMsg('Unauthorized: Only MANAGER or ADMIN role can mint defence assets.');
      return;
    }

    if (!ethers.isAddress(custodianAddress)) {
      setErrorMsg('Invalid custodian wallet address.');
      return;
    }

    try {
      setIsMinting(true);
      setErrorMsg(null);
      setMintResult(null);

      // STEP 1: Upload Metadata to IPFS
      setCurrentStep(1);
      const metadataPayload = {
        name: assetName,
        assetType,
        classificationLevel,
        description,
        serialNumber,
        specifications: specs,
        manufacturer: 'Bharat Electronics Limited (BEL)',
        mintedBy: account,
        initialCustodian: custodianAddress,
        createdAt: new Date().toISOString(),
      };

      const ipfsRes = await api.uploadMetadata(metadataPayload);
      const metadataCID = ipfsRes.cid;

      // STEP 2: Request MetaMask ERC-721 Mint Transaction
      setCurrentStep(2);
      const { txHash, tokenId } = await contractService.mintAsset(
        assetName,
        assetType,
        description,
        metadataCID,
        classificationLevel,
        custodianAddress,
        signer
      );

      // STEP 3: Confirm On-Chain
      setCurrentStep(3);

      // STEP 4: Record Security Audit Event
      setCurrentStep(4);
      await api.logAudit({
        category: 'ASSET',
        action: 'ASSET_MINTED',
        operator: account || '',
        subject: custodianAddress,
        resourceId: `ASSET_${tokenId}`,
        details: `Minted ${assetName} (ERC-721 #${tokenId}) with IPFS CID ${metadataCID}. Assigned to ${custodianAddress}.`,
        txHash,
        success: true,
      });

      // Also record in contract audit logger
      await contractService.recordOnChainAudit(
        'ASSET',
        'ASSET_MINTED',
        custodianAddress,
        `ASSET_${tokenId}`,
        `Minted ${assetName}`,
        true,
        signer
      );

      setMintResult({
        tokenId,
        cid: metadataCID,
        txHash,
      });
    } catch (err: any) {
      console.error('Minting failed:', err);
      setCurrentStep(0);
      if (err.message && err.message.includes('Custodian must have active registered identity')) {
        setErrorMsg('Security Rejection: The selected custodian address does not have an active registered identity in the DecentraX IdentityRegistry.');
      } else if (err.code === 4001 || (err.message && err.message.includes('rejected'))) {
        setErrorMsg('Transaction rejected in MetaMask.');
      } else {
        setErrorMsg(err.reason || err.message || 'Asset minting transaction failed.');
      }
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-slate-900">Mint Verifiable Defence Asset Record</h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            Manager Action
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Ingest technical specifications and documents into decentralized IPFS, then mint an immutable ERC-721 custody token on Polygon Amoy.
        </p>
      </div>

      {/* Role Clearance Notice */}
      {role !== 'MANAGER' && role !== 'ADMIN' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Restricted Functionality:</strong> Asset creation is restricted to the <strong>MANAGER</strong> or <strong>ADMIN</strong> roles. Your current role is <strong>{role}</strong>. Smart contract will revert unauthorized submissions.
            </span>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {mintResult && (
        <div className="decentra-card p-6 border-emerald-200 bg-emerald-50/40 space-y-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-emerald-900">
              Defence Asset Token Successfully Minted!
            </h3>
          </div>
          <p className="text-xs text-emerald-800">
            Asset <strong>{assetName}</strong> was tokenized as ERC-721 Token ID #{mintResult.tokenId} and custody allocated to {custodianAddress}.
          </p>

          <div className="p-3 bg-white rounded border border-emerald-200 font-mono text-[11px] space-y-1">
            <div>
              <span className="text-slate-500">Token ID:</span> #{mintResult.tokenId}
            </div>
            <div>
              <span className="text-slate-500">IPFS CID:</span> {mintResult.cid}
            </div>
            <div>
              <span className="text-slate-500">Transaction Hash:</span> {mintResult.txHash}
            </div>
          </div>

          <div className="flex space-x-3 pt-1">
            <button
              onClick={() => onNavigate('assets')}
              className="decentra-btn-primary text-xs"
            >
              View in Asset Directory
            </button>
            <button
              onClick={() => onNavigate('audit')}
              className="decentra-btn-secondary text-xs"
            >
              Inspect Audit Entry
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Minting Form & On-Chain / Off-Chain Data Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form (2 cols) */}
        <form onSubmit={handleMint} className="lg:col-span-2 decentra-card p-6 border-slate-200 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Asset Name / Nomenclature *
              </label>
              <input
                type="text"
                placeholder="e.g. BEL-TRX-900 Radar Transceiver"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                required
                className="decentra-input"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Asset Classification Type *
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                className="decentra-input"
              >
                <option value="TACTICAL_HARDWARE">Tactical Hardware</option>
                <option value="CRYPTO_KEYPAIR">Crypto Keypair</option>
                <option value="DEFENCE_DOCUMENT">Defence Document / Schematics</option>
                <option value="COMMUNICATION_CODE">Communication Code</option>
                <option value="SURVEILLANCE_SYSTEM">Surveillance System</option>
                <option value="RADAR_SYSTEM">Radar System</option>
                <option value="DRONE_FIRMWARE">Drone Firmware</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Security Classification *
              </label>
              <select
                value={classificationLevel}
                onChange={(e) => setClassificationLevel(e.target.value as ClassificationLevel)}
                className="decentra-input"
              >
                <option value="RESTRICTED">RESTRICTED</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="SECRET">SECRET</option>
                <option value="TOP_SECRET">TOP_SECRET</option>
                <option value="UNCLASSIFIED">UNCLASSIFIED</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hardware Serial / Batch Code *
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                required
                className="decentra-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description & Purpose *
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Phased array transceiver with multi-spectrum anti-jamming radar telemetry module."
              required
              className="decentra-input"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Technical Specifications (IPFS Dossier)
            </label>
            <textarea
              rows={3}
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              className="decentra-input font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Initial Verified Custodian Address *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="0x..."
                value={custodianAddress}
                onChange={(e) => setCustodianAddress(e.target.value)}
                required
                className="decentra-input font-mono flex-1"
              />
              {identities.length > 0 && (
                <select
                  onChange={(e) => setCustodianAddress(e.target.value)}
                  className="decentra-input max-w-[180px]"
                  value={custodianAddress}
                >
                  <option value="" disabled>Registered personnel...</option>
                  {identities.map((id) => (
                    <option key={id.wallet} value={id.wallet}>
                      {id.fullName} ({id.role})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Contract checks that recipient exists in DecentraX IdentityRegistry before minting.
            </span>
          </div>

          {/* Step Progress Tracker */}
          {isMinting && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                <span>Minting Pipeline in Progress...</span>
                <span>Step {currentStep} of 4</span>
              </div>
              <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-700 h-full transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
              <div className="text-[11px] text-blue-800">
                {currentStep === 1 && '1. Pinning technical metadata to IPFS...'}
                {currentStep === 2 && '2. Requesting MetaMask ERC-721 mint transaction...'}
                {currentStep === 3 && '3. Awaiting Polygon Amoy block confirmation...'}
                {currentStep === 4 && '4. Logging event in immutable security audit journal...'}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isMinting || (role !== 'MANAGER' && role !== 'ADMIN')}
              className="decentra-btn-primary flex items-center space-x-2 py-2.5 px-6"
            >
              {isMinting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Mint...</span>
                </>
              ) : (
                <>
                  <Boxes className="w-4 h-4 text-sky-400" />
                  <span>Ingest to IPFS & Mint NFT Record</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Architecture Breakdown (On-Chain vs Off-Chain) */}
        <div className="space-y-4">
          <div className="decentra-card p-5 border-slate-200 text-xs">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-700" />
              On-Chain vs Off-Chain Storage Architecture
            </h3>
            <p className="text-slate-500 text-[11px] mb-3 leading-relaxed">
              Defence standards require strict minimization of sensitive data on public ledgers:
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-800 flex items-center gap-1 text-[11px]">
                  <Boxes className="w-3.5 h-3.5 text-blue-600" /> On-Chain (AssetNFT.sol)
                </span>
                <ul className="mt-1 space-y-1 text-[10px] text-slate-600 list-disc list-inside">
                  <li>Token ID (Sequential uint256)</li>
                  <li>Asset Name & Category</li>
                  <li>IPFS Metadata URI (<code className="font-mono">ipfs://Qm...</code>)</li>
                  <li>Verified Custodian Address</li>
                  <li>Lifecycle Status (CREATED, ALLOCATED, etc.)</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-800 flex items-center gap-1 text-[11px]">
                  <Database className="w-3.5 h-3.5 text-purple-600" /> Off-Chain (IPFS / Pinata)
                </span>
                <ul className="mt-1 space-y-1 text-[10px] text-slate-600 list-disc list-inside">
                  <li>Complete Technical Specifications</li>
                  <li>Serial Numbers & Hardware Revision</li>
                  <li>Classified Schematics / Firmware Binaries</li>
                  <li>Manufacturer & Custody Logs</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-100 rounded-md border border-slate-200 text-[11px] text-slate-600 leading-snug">
            <strong>Defence Compliance Rule:</strong> The recipient must have an active identity in the DecentraX IdentityRegistry before minting or allocating.
          </div>
        </div>
      </div>
    </div>
  );
};
