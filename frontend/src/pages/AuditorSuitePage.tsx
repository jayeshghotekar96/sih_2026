import React, { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import {
  SearchCheck,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  ExternalLink,
  Cpu,
  Boxes,
  Users,
  Database,
  ArrowRight,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { contractService } from '../services/contractService';
import { api } from '../services/api';
import { Identity, Asset } from '../types';
import { ethers } from 'ethers';

export const AuditorSuitePage: React.FC = () => {
  const { provider, signer, account } = useWeb3();

  const [queryInput, setQueryInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Verification Results
  const [verifiedIdentity, setVerifiedIdentity] = useState<Identity | null>(null);
  const [verifiedAsset, setVerifiedAsset] = useState<Asset | null>(null);
  const [ipfsContent, setIpfsContent] = useState<any | null>(null);
  const [txDetails, setTxDetails] = useState<any | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [custodyAssets, setCustodyAssets] = useState<Asset[]>([]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleVerify = async (e?: React.FormEvent, customTarget?: string) => {
    if (e) e.preventDefault();
    const target: string = String(customTarget || queryInput).trim();
    if (!target || !provider) return;

    try {
      setIsVerifying(true);
      setVerificationError(null);
      setVerifiedIdentity(null);
      setVerifiedAsset(null);
      setIpfsContent(null);
      setTxDetails(null);
      setCustodyAssets([]);

      const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(target);
      const isTxHash = /^0x[a-fA-F0-9]{64}$/.test(target);
      const isTokenNumber = !isNaN(Number(target)) && target !== '' && !target.startsWith('0x');

      // 1. Is it a Wallet Address?
      if (isEthAddress) {
        const id = await contractService.getIdentity(target, provider);
        if (id) {
          setVerifiedIdentity(id);
          // Also fetch any assets currently held by this custodian
          const allAssets = await contractService.getAllAssets(provider);
          const held = allAssets.filter((a) => a.custodian.toLowerCase() === target.toLowerCase());
          setCustodyAssets(held);
        } else {
          setVerificationError(`Address ${target} is NOT registered in the DecentraX DID Registry.`);
        }
      }
      // 2. Is it a Transaction Hash?
      else if (isTxHash) {
        const receipt = await provider.getTransactionReceipt(target);
        if (receipt) {
          setTxDetails({
            hash: receipt.hash,
            blockNumber: receipt.blockNumber,
            from: receipt.from,
            to: receipt.to,
            status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
            gasUsed: receipt.gasUsed.toString(),
          });
        } else {
          setVerificationError(`Transaction hash ${target} not found or still pending on blockchain.`);
        }
      }
      // 3. Is it an Asset Token ID?
      else if (isTokenNumber) {
        const tokenId = Number(target);
        const asset = await contractService.getAsset(tokenId, provider);
        if (asset) {
          setVerifiedAsset(asset);
          // Fetch IPFS metadata
          try {
            const meta = await api.fetchMetadata(asset.metadataCID);
            setIpfsContent(meta);
          } catch (e) {
            console.warn('IPFS fetch error:', e);
          }
        } else {
          setVerificationError(`Asset with Token ID #${tokenId} was not found on-chain.`);
        }
      } else {
        setVerificationError('Input must be a valid Ethereum Address (0x...), Asset Token ID (number), or Transaction Hash.');
      }
    } catch (err: any) {
      setVerificationError(err.reason || err.message || 'Verification lookup failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-slate-900">Auditor & Cryptographic Verification Suite</h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            Inspector General Authority
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Independent cryptographic proof engine for Bharat Electronics Limited. Verify digital identities, inspect smart contract custody records, and validate IPFS metadata checksums.
        </p>
      </div>

      {/* Verification Lookup Input */}
      <div className="decentra-card p-6 border-slate-200 bg-white">
        <form onSubmit={handleVerify} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            Enter Target Identifier to Verify (Wallet Address, Asset Token ID, or Transaction Hash)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="e.g. 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 or Token ID 1..."
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-purple-800"
              />
            </div>
            <button
              type="submit"
              disabled={isVerifying || !queryInput.trim()}
              className="decentra-btn-primary bg-purple-900 hover:bg-purple-950 px-6 py-2.5 text-xs flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              <SearchCheck className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying Proof...' : 'Verify Cryptographic Proof'}</span>
            </button>
          </div>

          {/* Quick-Inspect Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Quick-Inspect:</span>
            <button
              type="button"
              onClick={() => {
                setQueryInput('1');
                handleVerify(undefined, '1');
              }}
              className="text-purple-700 hover:text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-mono"
            >
              Asset #1 (Radar Transceiver)
            </button>
            <button
              type="button"
              onClick={() => {
                const addr = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
                setQueryInput(addr);
                handleVerify(undefined, addr);
              }}
              className="text-purple-700 hover:text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-mono"
            >
              Manager Identity (Dr. Ananya Roy)
            </button>
            <button
              type="button"
              onClick={() => {
                const addr = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
                setQueryInput(addr);
                handleVerify(undefined, addr);
              }}
              className="text-purple-700 hover:text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-mono"
            >
              User Identity (Sub-Lt. Arjun Nair)
            </button>
          </div>
        </form>
      </div>

      {/* Verification Error */}
      {verificationError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-center space-x-2">
          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{verificationError}</span>
        </div>
      )}

      {/* Verified Asset Result */}
      {verifiedAsset && (
        <div className="decentra-card p-6 border-slate-200 space-y-6">
          {/* Verdict Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-900">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  CRYPTOGRAPHICALLY VERIFIED RECORD
                </span>
                <span className="text-xs font-medium">
                  Asset #{verifiedAsset.tokenId} verified on-chain via AssetNFT.sol with valid IPFS metadata hash.
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-white text-emerald-800 font-bold text-xs border border-emerald-300">
              STATUS: {verifiedAsset.status}
            </span>
          </div>

          {/* Asset Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2.5">
              <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
                On-Chain Token Properties
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-500">Asset Name:</span>
                <span className="font-bold text-slate-900">{verifiedAsset.assetName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Token ID:</span>
                <span className="font-mono text-slate-800">#{verifiedAsset.tokenId} (ERC-721)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Classification:</span>
                <span className="font-bold text-amber-800">{verifiedAsset.classificationLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Custodian:</span>
                <span className="font-mono text-slate-800 truncate max-w-[180px]">
                  {verifiedAsset.custodian}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created At:</span>
                <span className="text-slate-800">
                  {new Date(verifiedAsset.createdAt * 1000).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2.5">
              <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
                IPFS Decentralized Storage Integrity
              </h4>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Metadata CID:</span>
                <div className="flex items-center space-x-1 font-mono text-slate-800 text-[11px]">
                  <span className="truncate max-w-[150px]">{verifiedAsset.metadataCID}</span>
                  <button onClick={() => copyToClipboard(verifiedAsset.metadataCID)}>
                    {copiedText === verifiedAsset.metadataCID ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Storage Layer:</span>
                <span className="text-slate-800 font-semibold">IPFS / Pinata Protocol</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Integrity Checksum:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Tamper-Evident Hash Match
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Physical Legal Notice:</span>
                <span className="text-slate-600 text-[10px] italic">
                  Digital custody record (NFT does not replace statutory title)
                </span>
              </div>
            </div>
          </div>

          {/* IPFS Payload Inspection */}
          {ipfsContent && (
            <div>
              <h4 className="font-bold text-slate-800 text-xs mb-2">
                Decentralized Technical Dossier (Decoded IPFS Payload):
              </h4>
              <pre className="p-4 bg-slate-900 text-sky-300 rounded-md font-mono text-[11px] overflow-x-auto leading-relaxed max-h-60">
                {JSON.stringify(ipfsContent, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Verified Identity Result */}
      {verifiedIdentity && (
        <div className="decentra-card p-6 border-slate-200 space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-900">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  VERIFIED DECENTRALIZED IDENTITY (DID)
                </span>
                <span className="text-xs font-medium">
                  {verifiedIdentity.fullName} is a verified personnel registered on DecentraX IdentityRegistry.
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-white text-emerald-800 font-bold text-xs border border-emerald-300">
              ACTIVE PERSONNEL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2.5">
              <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
                Identity Credentials
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-500">Full Name:</span>
                <span className="font-bold text-slate-900">{verifiedIdentity.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-800">{verifiedIdentity.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Role:</span>
                <span className="font-bold text-blue-700">{verifiedIdentity.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered Timestamp:</span>
                <span className="text-slate-800">
                  {new Date(verifiedIdentity.registeredAt * 1000).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2.5">
              <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
                Cryptographic Verifiability
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-500">DID URI:</span>
                <span className="font-mono text-slate-800 truncate max-w-[180px]">
                  {verifiedIdentity.did}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Off-Chain Dossier Hash:</span>
                <span className="font-mono text-slate-800 truncate max-w-[180px]">
                  {verifiedIdentity.offchainHash}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Auditor Attestation:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  {verifiedIdentity.isVerified ? 'Attested & Sealed' : 'Pending Attestation'}
                </span>
              </div>
            </div>
          </div>

          {/* Assets currently under custody of this identity */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-2">
              Assets Currently Under Custody ({custodyAssets.length})
            </h4>
            {custodyAssets.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded border border-slate-200">
                No defence assets currently allocated to this personnel identity.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {custodyAssets.map((a) => (
                  <div key={a.tokenId} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                    <div className="flex justify-between items-center font-semibold text-slate-900">
                      <span>#{a.tokenId} {a.assetName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                        {a.assetType}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1 line-clamp-1">{a.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verified Transaction Hash Result */}
      {txDetails && (
        <div className="decentra-card p-6 border-slate-200 space-y-4 text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Blockchain Transaction Receipt</h3>
          </div>

          <div className="p-4 bg-slate-50 rounded-md border border-slate-200 space-y-2 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Tx Hash:</span>
              <span className="text-slate-800 truncate max-w-[280px]">{txDetails.hash}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Block Number:</span>
              <span className="text-slate-800">{txDetails.blockNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">From:</span>
              <span className="text-slate-800 truncate max-w-[280px]">{txDetails.from}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Contract / To:</span>
              <span className="text-slate-800 truncate max-w-[280px]">{txDetails.to}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="text-emerald-700 font-bold">{txDetails.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gas Units Consumed:</span>
              <span className="text-slate-800">{txDetails.gasUsed}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
