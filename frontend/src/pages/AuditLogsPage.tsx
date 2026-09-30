import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import {
  FileCheck2,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Shield,
  Download,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';
import { contractService } from '../services/contractService';
import { AuditLogEntry } from '../types';

export const AuditLogsPage: React.FC = () => {
  const { provider, signer } = useWeb3();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAuditLogs({ limit: 200 });
      setLogs(res.logs || []);
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(text);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `decentrax_audit_log_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = logs.filter((item) => {
    const matchesSearch =
      item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.resourceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.txHash && item.txHash.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesAction = actionFilter === 'ALL' || item.action === actionFilter;

    return matchesSearch && matchesCategory && matchesAction;
  });

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">Immutable Security Audit Trail</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              DecentraXAuditLogger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically indexed, tamper-evident log of all identity, access control, and asset custody operations for Bharat Electronics Limited.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportJSON}
            className="decentra-btn-secondary text-xs flex items-center space-x-1.5"
            title="Export for compliance archive"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Archive</span>
          </button>

          <button
            onClick={loadLogs}
            disabled={isLoading}
            className="decentra-btn-secondary text-xs flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="decentra-card p-4 border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Action, Wallet, Resource, or Tx Hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="IDENTITY">Identity Events</option>
            <option value="ACCESS">Access Control Events</option>
            <option value="ASSET">Asset Custody Events</option>
            <option value="AUTH">Authentication Events</option>
            <option value="SYSTEM">System Initialization</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
          >
            <option value="ALL">All Action Types</option>
            <option value="IDENTITY_REGISTERED">Identity Registered</option>
            <option value="ROLE_ASSIGNED">Role Assigned</option>
            <option value="ROLE_REVOKED">Role Revoked</option>
            <option value="ASSET_MINTED">Asset Minted</option>
            <option value="ASSET_ALLOCATED">Asset Allocated</option>
            <option value="ASSET_AUDITED">Asset Audited</option>
            <option value="ACCESS_EVALUATED">Access Evaluated</option>
            <option value="WALLET_AUTHENTICATION">Wallet Authentication</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="decentra-card border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Operator (Wallet)</th>
                <th className="py-3 px-4">Resource / Subject</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Transaction Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {isLoading ? 'Fetching audit records...' : 'No audit entries match the current filter.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
                          log.category === 'IDENTITY'
                            ? 'bg-sky-50 text-blue-800 border-sky-200'
                            : log.category === 'ACCESS'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : log.category === 'ASSET'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                      <span className="truncate max-w-[120px] block" title={log.operator}>
                        {log.operator.substring(0, 10)}...
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <span className="truncate max-w-[130px] block" title={log.resourceId}>
                        {log.resourceId}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-[240px] truncate" title={log.details}>
                      {log.details}
                    </td>

                    <td className="py-3 px-4">
                      {log.success ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 text-[11px] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Success</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-red-700 text-[11px] font-medium">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          <span>Denied</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[11px]">
                      {log.txHash ? (
                        <div className="flex items-center justify-end space-x-1 text-blue-700">
                          <span className="truncate max-w-[90px]">{log.txHash.substring(0, 8)}...</span>
                          <button
                            onClick={() => copyToClipboard(log.txHash!)}
                            className="text-slate-400 hover:text-slate-700"
                            title="Copy Tx Hash"
                          >
                            {copiedTx === log.txHash ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Off-Chain Event</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
