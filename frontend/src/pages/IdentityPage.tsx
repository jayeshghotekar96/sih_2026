import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import {
  Users,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Shield,
  Copy,
  Check,
  Search,
  ExternalLink,
  Lock,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { contractService } from '../services/contractService';
import { api } from '../services/api';
import { Identity, Role } from '../types';
import { ethers } from 'ethers';

export const IdentityPage: React.FC = () => {
  const { account, role, identity: currentIdentity, signer, provider, isConnected, refreshState } = useWeb3();

  const [identities, setIdentities] = useState<Identity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Form State
  const [formAddress, setFormAddress] = useState('');
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState('Avionics & Radar Systems - BEL');
  const [formRole, setFormRole] = useState<Role>('USER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txSuccessMsg, setTxSuccessMsg] = useState<string | null>(null);
  const [txErrorMsg, setTxErrorMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Selected identity for DID Document modal
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null);

  const loadIdentities = async () => {
    if (!provider) return;
    try {
      setIsLoading(true);
      const data = await contractService.getAllIdentities(provider);
      setIdentities(data);
    } catch (err: any) {
      console.warn('Error loading identities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIdentities();
  }, [provider]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleRegisterIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) {
      setTxErrorMsg('Please connect an authorized Admin wallet.');
      return;
    }

    if (!ethers.isAddress(formAddress)) {
      setTxErrorMsg('Invalid Ethereum wallet address format.');
      return;
    }

    if (!formName.trim()) {
      setTxErrorMsg('Full Name / Designation is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setTxErrorMsg(null);
      setTxSuccessMsg(null);

      // Generate offchain cryptographic dossier hash
      const dossierPayload = JSON.stringify({
        wallet: formAddress.toLowerCase(),
        name: formName,
        department: formDept,
        registeredAt: new Date().toISOString(),
      });
      const offchainHash = ethers.keccak256(ethers.toUtf8Bytes(dossierPayload));

      const { txHash } = await contractService.registerIdentity(
        formAddress,
        formName,
        formDept,
        offchainHash,
        formRole,
        signer
      );

      // Log event to backend audit ledger
      await api.logAudit({
        category: 'IDENTITY',
        action: 'IDENTITY_REGISTERED',
        operator: account || '',
        subject: formAddress,
        resourceId: `did:decentrax:${formAddress.toLowerCase()}`,
        details: `Personnel ${formName} registered under ${formDept} with initial role ${formRole}`,
        txHash,
        success: true,
      });

      setTxSuccessMsg(`Identity successfully registered on-chain! Tx: ${txHash.substring(0, 10)}...`);
      setFormAddress('');
      setFormName('');

      await loadIdentities();
      await refreshState();
    } catch (err: any) {
      console.error('Registration failed:', err);
      if (err.message && err.message.includes('Identity already registered')) {
        setTxErrorMsg('This wallet address already has a registered identity in the DID Registry.');
      } else if (err.code === 4001 || (err.message && err.message.includes('rejected'))) {
        setTxErrorMsg('Transaction rejected in MetaMask.');
      } else {
        setTxErrorMsg(err.reason || err.message || 'Identity registration transaction failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userAddress: string, currentStatus: boolean) => {
    if (!signer || role !== 'ADMIN') {
      alert('Only ADMIN can suspend or reactivate identities.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newStatus = !currentStatus;
      const { txHash } = await contractService.setIdentityActiveStatus(userAddress, newStatus, signer);

      await api.logAudit({
        category: 'IDENTITY',
        action: newStatus ? 'IDENTITY_REACTIVATED' : 'IDENTITY_SUSPENDED',
        operator: account || '',
        subject: userAddress,
        resourceId: `did:decentrax:${userAddress.toLowerCase()}`,
        details: `Identity active status changed to ${newStatus}`,
        txHash,
        success: true,
      });

      await loadIdentities();
    } catch (err: any) {
      alert(err.reason || err.message || 'Failed to update identity status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttestIdentity = async (userAddress: string) => {
    if (!signer || (role !== 'AUDITOR' && role !== 'ADMIN')) {
      alert('Only AUDITOR or ADMIN can attest cryptographic identity credentials.');
      return;
    }

    try {
      setIsSubmitting(true);
      const { txHash } = await contractService.attestIdentity(
        userAddress,
        'Audited and verified against BEL Personnel Credential Standards',
        signer
      );

      await api.logAudit({
        category: 'IDENTITY',
        action: 'IDENTITY_ATTESTED',
        operator: account || '',
        subject: userAddress,
        resourceId: `did:decentrax:${userAddress.toLowerCase()}`,
        details: 'Auditor attestation confirmed on-chain',
        txHash,
        success: true,
      });

      await loadIdentities();
      alert('Identity attestation verified successfully on-chain!');
    } catch (err: any) {
      alert(err.reason || err.message || 'Attestation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredIdentities = identities.filter((item) => {
    const matchesSearch =
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.wallet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.did.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'ACTIVE') return matchesSearch && item.isActive;
    if (statusFilter === 'SUSPENDED') return matchesSearch && !item.isActive;
    return matchesSearch;
  });

  return (
    <div className="space-y-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">Decentralized Identity (DID) Registry</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-blue-800 border border-sky-200">
              did:decentrax
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verifiable digital identities for Bharat Electronics Limited personnel. Off-chain cryptographic hashes guarantee privacy while preserving on-chain integrity.
          </p>
        </div>

        <button
          onClick={loadIdentities}
          disabled={isLoading}
          className="decentra-btn-secondary text-xs flex items-center space-x-1.5 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* User's Own Identity Card (if registered) */}
      {currentIdentity && (
        <div className="decentra-card p-5 border-blue-200 bg-blue-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-sm">
                {currentIdentity.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-sm">{currentIdentity.fullName}</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 rounded">
                    {currentIdentity.role}
                  </span>
                  {currentIdentity.isVerified && (
                    <span className="flex items-center space-x-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{currentIdentity.department}</p>
                <div className="flex items-center space-x-2 mt-1 text-xs font-mono text-slate-500">
                  <span className="truncate max-w-[280px]">{currentIdentity.did}</span>
                  <button
                    onClick={() => copyToClipboard(currentIdentity.did)}
                    className="hover:text-slate-800"
                    title="Copy DID"
                  >
                    {copiedText === currentIdentity.did ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedIdentity(currentIdentity)}
              className="decentra-btn-secondary text-xs flex items-center space-x-1.5 self-start sm:self-center"
            >
              <FileText className="w-3.5 h-3.5 text-blue-700" />
              <span>Inspect W3C DID Document</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Registration Form */}
      {role === 'ADMIN' ? (
        <div className="decentra-card p-6 border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <UserPlus className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">Provision New Personnel Identity</h3>
            <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Admin Clearance
            </span>
          </div>

          {txSuccessMsg && (
            <div className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{txSuccessMsg}</span>
            </div>
          )}

          {txErrorMsg && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{txErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegisterIdentity} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Wallet Address (EVM / Polygon) *
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                required
                className="decentra-input font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Cryptographically binds this wallet to the generated DID.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name / Designation *
              </label>
              <input
                type="text"
                placeholder="e.g. Cdr. Sunita Verma"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="decentra-input"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Department / Division *
              </label>
              <select
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
                className="decentra-input"
              >
                <option value="Avionics & Radar Systems - BEL">Avionics & Radar Systems - BEL</option>
                <option value="Strategic Electronic Defense - BEL HQ">Strategic Electronic Defense - BEL HQ</option>
                <option value="Naval Operations & Tactical Warfare - BEL">Naval Operations & Tactical Warfare - BEL</option>
                <option value="Quality Assurance & Cryptographic Audit - BEL">Quality Assurance & Cryptographic Audit - BEL</option>
                <option value="Unmanned Systems & Drone Defense - BEL">Unmanned Systems & Drone Defense - BEL</option>
                <option value="Cyber Security & Communication Networks - BEL">Cyber Security & Communication Networks - BEL</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assigned RBAC Role *
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as Role)}
                className="decentra-input"
              >
                <option value="USER">USER (Standard Verified Personnel)</option>
                <option value="MANAGER">MANAGER (Asset & Custody Custodian)</option>
                <option value="AUDITOR">AUDITOR (Independent Inspector)</option>
                <option value="ADMIN">ADMIN (System Authority)</option>
              </select>
            </div>

            <div className="md:col-span-2 pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="decentra-btn-primary flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Confirming On-Chain...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register Identity On Blockchain</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-slate-500" />
            <span>
              Identity registration is restricted to the <strong>ADMIN</strong> role. Connect an Admin wallet to register new personnel.
            </span>
          </div>
          <span className="font-semibold text-slate-500 uppercase text-[10px]">Read-Only Mode</span>
        </div>
      )}

      {/* Directory of Registered Identities */}
      <div className="decentra-card border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Name, Wallet, DID, or Department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-800"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="SUSPENDED">Suspended Only</option>
            </select>
          </div>
        </div>

        {/* Identities Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Personnel & DID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Integrity Hash</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIdentities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    {isLoading ? 'Loading on-chain DID directory...' : 'No registered identities found matching query.'}
                  </td>
                </tr>
              ) : (
                filteredIdentities.map((item) => (
                  <tr key={item.wallet} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.fullName}</div>
                      <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-500 mt-0.5">
                        <span className="truncate max-w-[150px]">{item.did}</span>
                        <button
                          onClick={() => copyToClipboard(item.wallet)}
                          title="Copy Wallet"
                          className="hover:text-slate-800"
                        >
                          {copiedText === item.wallet ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                      {item.department}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {item.role}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                      {item.offchainHash.substring(0, 14)}...
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        {item.isActive ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            Suspended
                          </span>
                        )}
                        {item.isVerified && (
                          <span title="Verified by Auditor">
                            <CheckCircle className="w-3.5 h-3.5 text-sky-600 inline ml-1" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedIdentity(item)}
                        className="text-blue-700 hover:text-blue-900 font-medium"
                      >
                        DID Doc
                      </button>

                      {(role === 'AUDITOR' || role === 'ADMIN') && !item.isVerified && (
                        <button
                          onClick={() => handleAttestIdentity(item.wallet)}
                          disabled={isSubmitting}
                          className="text-purple-700 hover:text-purple-900 font-medium"
                        >
                          Attest
                        </button>
                      )}

                      {role === 'ADMIN' && (
                        <button
                          onClick={() => handleToggleStatus(item.wallet, item.isActive)}
                          disabled={isSubmitting}
                          className={`font-medium ${item.isActive ? 'text-red-600 hover:text-red-800' : 'text-emerald-600 hover:text-emerald-800'}`}
                        >
                          {item.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DID Document Inspection Modal */}
      {selectedIdentity && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="decentra-card w-full max-w-2xl bg-white p-6 shadow-modal max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-bold text-slate-900">
                  W3C Decentralized Identifier (DID) Document
                </h3>
              </div>
              <button
                onClick={() => setSelectedIdentity(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <p className="text-slate-600">
                Cryptographic DID document for <strong>{selectedIdentity.fullName}</strong> conforming to W3C Decentralized Identifier v1.0 specifications:
              </p>

              <pre className="p-4 bg-slate-900 text-sky-300 rounded-md font-mono text-[11px] overflow-x-auto leading-relaxed">
{JSON.stringify(
  {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://decentrax.bel.in/security/v1"
    ],
    "id": selectedIdentity.did,
    "controller": selectedIdentity.wallet,
    "verificationMethod": [
      {
        "id": `${selectedIdentity.did}#key-1`,
        "type": "EcdsaSecp256k1RecoveryMethod2020",
        "controller": selectedIdentity.did,
        "blockchainAccountId": `eip155:80002:${selectedIdentity.wallet}`
      }
    ],
    "authentication": [
      `${selectedIdentity.did}#key-1`
    ],
    "service": [
      {
        "id": `${selectedIdentity.did}#registry`,
        "type": "DecentraXIdentityService",
        "serviceEndpoint": "https://decentrax.bel.in/api"
      }
    ],
    "decentraxClaims": {
      "fullName": selectedIdentity.fullName,
      "department": selectedIdentity.department,
      "assignedRole": selectedIdentity.role,
      "offchainDossierHash": selectedIdentity.offchainHash,
      "isVerified": selectedIdentity.isVerified,
      "isActive": selectedIdentity.isActive,
      "registeredTimestamp": selectedIdentity.registeredAt,
    }
  },
  null,
  2
)}
              </pre>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedIdentity(null)}
                  className="decentra-btn-primary text-xs"
                >
                  Close Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
