import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import {
  ShieldAlert,
  UserCheck,
  UserMinus,
  CheckCircle,
  AlertCircle,
  Shield,
  Layers,
  RefreshCw,
  Search,
  ArrowRight,
} from 'lucide-react';
import { contractService } from '../services/contractService';
import { api } from '../services/api';
import { Role, Identity } from '../types';
import { ethers } from 'ethers';

export const RoleManagementPage: React.FC = () => {
  const { account, role: currentRole, signer, provider, isConnected, refreshState } = useWeb3();

  const [identities, setIdentities] = useState<Identity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [targetAccount, setTargetAccount] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('MANAGER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!provider) return;
    try {
      setIsLoading(true);
      const data = await contractService.getAllIdentities(provider);
      setIdentities(data);
    } catch (err) {
      console.warn('Failed to load identities for role mgmt:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [provider]);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || currentRole !== 'ADMIN') {
      setErrorMsg('Only ADMIN can assign roles.');
      return;
    }

    if (!ethers.isAddress(targetAccount)) {
      setErrorMsg('Invalid wallet address.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const { txHash } = await contractService.assignRole(selectedRole, targetAccount, signer);

      await api.logAudit({
        category: 'ACCESS',
        action: 'ROLE_ASSIGNED',
        operator: account || '',
        subject: targetAccount,
        resourceId: `ROLE_${selectedRole}`,
        details: `Assigned role ${selectedRole} to account`,
        txHash,
        success: true,
      });

      setSuccessMsg(`Role ${selectedRole} successfully assigned on-chain! Tx: ${txHash.substring(0, 10)}...`);
      setTargetAccount('');
      await loadData();
      await refreshState();
    } catch (err: any) {
      setErrorMsg(err.reason || err.message || 'Failed to assign role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeRole = async (targetAddr: string, roleToRevoke: Role) => {
    if (!signer || currentRole !== 'ADMIN') {
      alert('Only ADMIN can revoke roles.');
      return;
    }

    if (!window.confirm(`Revoke ${roleToRevoke} role from ${targetAddr}?`)) return;

    try {
      setIsSubmitting(true);
      const { txHash } = await contractService.revokeRole(roleToRevoke, targetAddr, signer);

      await api.logAudit({
        category: 'ACCESS',
        action: 'ROLE_REVOKED',
        operator: account || '',
        subject: targetAddr,
        resourceId: `ROLE_${roleToRevoke}`,
        details: `Revoked role ${roleToRevoke} from account`,
        txHash,
        success: true,
      });

      alert(`Role ${roleToRevoke} revoked successfully.`);
      await loadData();
      await refreshState();
    } catch (err: any) {
      alert(err.reason || err.message || 'Failed to revoke role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ROLE_PERMISSIONS_MATRIX = [
    {
      role: 'ADMIN',
      badge: 'bg-red-50 text-red-700 border-red-200',
      description: 'Supreme operational authority and identity governor for Bharat Electronics Limited.',
      permissions: [
        'Register new personnel identities in DID Registry',
        'Assign and revoke RBAC roles on smart contract',
        'Suspend or reactivate personnel credentials',
        'Oversee and decommission defence asset tokens',
        'Inspect immutable security audit journal',
      ],
    },
    {
      role: 'MANAGER',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Asset lifecycle custodian for technical departments and manufacturing divisions.',
      permissions: [
        'Create new defence asset records with IPFS metadata',
        'Mint ERC-721 digital asset tokens on Polygon Amoy',
        'Allocate asset custody to verified personnel identities',
        'Initiate permitted custody transfers',
        'Update asset operational status (Allocated, In-Transit)',
      ],
    },
    {
      role: 'AUDITOR',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Independent inspection authority ensuring compliance, chain-of-custody, and non-repudiation.',
      permissions: [
        'Cryptographically attest personnel identity credentials',
        'Verify ERC-721 asset ownership and IPFS CID integrity',
        'Inspect and verify append-only security audit events',
        'Run policy enforcement tests and compliance checks',
        'No direct state mutation (cannot mint or transfer assets)',
      ],
    },
    {
      role: 'USER',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Standard verified defence personnel and field tactical operators.',
      permissions: [
        'View allocated defence assets and technical specifications',
        'Access permitted departmental resources',
        'View and verify own W3C DID document',
        'Check own on-chain authorization status',
        'Cannot mint, reallocate, or modify system policies',
      ],
    },
  ];

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-slate-900">Role-Based Access Control (RBAC) Console</h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            OpenZeppelin AccessControl
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Multi-tier cryptographic privilege governance. Permissions are enforced on the smart contract layer, ensuring actions cannot be bypassed.
        </p>
      </div>

      {/* Role Permission Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLE_PERMISSIONS_MATRIX.map((item) => (
          <div key={item.role} className="decentra-card p-5 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${item.badge}`}>
                  {item.role}
                </span>
                {currentRole === item.role && (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    Your Role
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 mb-3 leading-snug">{item.description}</p>
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-2">
                  Permitted Actions:
                </span>
                <ul className="space-y-1.5 text-[11px] text-slate-700">
                  {item.permissions.map((perm, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span className="leading-tight">{perm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Action: Assign Role */}
      {currentRole === 'ADMIN' ? (
        <div className="decentra-card p-6 border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <UserCheck className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">Assign On-Chain Role</h3>
            <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Admin Exclusive
            </span>
          </div>

          {successMsg && (
            <div className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAssignRole} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Target Wallet Address *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="0x..."
                  value={targetAccount}
                  onChange={(e) => setTargetAccount(e.target.value)}
                  required
                  className="decentra-input font-mono flex-1"
                />
                {identities.length > 0 && (
                  <select
                    onChange={(e) => setTargetAccount(e.target.value)}
                    className="decentra-input max-w-[180px]"
                    defaultValue=""
                  >
                    <option value="" disabled>Select registered...</option>
                    {identities.map((id) => (
                      <option key={id.wallet} value={id.wallet}>
                        {id.fullName} ({id.role})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Role to Grant *
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="decentra-input"
              >
                <option value="MANAGER">MANAGER</option>
                <option value="AUDITOR">AUDITOR</option>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="decentra-btn-primary flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Role Grant...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Confirm Role Assignment</span>
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
              Role modification is restricted to the <strong>ADMIN</strong> role. Connect an Admin wallet to assign or revoke permissions.
            </span>
          </div>
          <span className="font-semibold text-slate-500 uppercase text-[10px]">Read-Only Governance</span>
        </div>
      )}

      {/* Active Role Allocations Table */}
      <div className="decentra-card border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Current Role Allocations in Directory</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Personnel holding active cryptographic access rights on DecentraXAccessControl
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Account / Personnel</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Active Role</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {identities.map((item) => (
                <tr key={item.wallet} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{item.fullName}</div>
                    <div className="font-mono text-[11px] text-slate-500">{item.wallet}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{item.department}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      {item.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {currentRole === 'ADMIN' && (
                      <button
                        onClick={() => handleRevokeRole(item.wallet, item.role)}
                        disabled={isSubmitting || item.wallet.toLowerCase() === account?.toLowerCase()}
                        className="text-red-600 hover:text-red-800 font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                        title={item.wallet.toLowerCase() === account?.toLowerCase() ? "Cannot revoke self" : "Revoke role"}
                      >
                        Revoke Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
