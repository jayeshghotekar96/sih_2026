import { AuditLogEntry } from '../types';

const metaEnv = (import.meta as any)?.env || {};
const DEFAULT_REMOTE_BACKEND = 'https://sih-2026-1dai.onrender.com';
const RAW_BACKEND_URL = (
  metaEnv.VITE_BACKEND_URL ||
  metaEnv.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '' : DEFAULT_REMOTE_BACKEND)
).trim().replace(/\/+$/, '');
const API_BASE = RAW_BACKEND_URL ? (RAW_BACKEND_URL.endsWith('/api') ? RAW_BACKEND_URL : `${RAW_BACKEND_URL}/api`) : '/api';

export const api = {
  // IPFS Metadata Upload
  uploadMetadata: async (metadata: any) => {
    const res = await fetch(`${API_BASE}/ipfs/upload-metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'IPFS upload failed' }));
      throw new Error(err.error || 'Failed to upload metadata to IPFS');
    }
    return res.json();
  },

  // Fetch IPFS Metadata
  fetchMetadata: async (cid: string) => {
    const res = await fetch(`${API_BASE}/ipfs/${cid}`);
    if (!res.ok) {
      throw new Error(`Failed to retrieve IPFS content for CID ${cid}`);
    }
    return res.json();
  },

  // Request Auth Challenge
  getChallenge: async (address: string) => {
    const res = await fetch(`${API_BASE}/auth/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    if (!res.ok) {
      throw new Error('Failed to request authentication challenge');
    }
    return res.json();
  },

  // Verify Signature
  verifyAuth: async (address: string, signature: string) => {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Signature verification failed' }));
      throw new Error(err.error || 'Authentication signature verification failed');
    }
    return res.json();
  },

  // Record Audit Log Entry
  logAudit: async (entry: Partial<AuditLogEntry>) => {
    try {
      const res = await fetch(`${API_BASE}/audit/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      return res.json();
    } catch (err) {
      console.warn('Backend audit log call failed:', err);
      return null;
    }
  },

  // Query Audit Logs
  getAuditLogs: async (params?: { category?: string; action?: string; wallet?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.action) query.set('action', params.action);
    if (params?.wallet) query.set('wallet', params.wallet);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/audit/logs?${query.toString()}`);
    if (!res.ok) {
      throw new Error('Failed to fetch audit logs');
    }
    return res.json();
  },

  // System Health
  getSystemHealth: async () => {
    const res = await fetch(`${API_BASE}/system/health`);
    if (!res.ok) {
      throw new Error('System health check failed');
    }
    return res.json();
  },
};
