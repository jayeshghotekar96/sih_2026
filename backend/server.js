import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { ethers } from 'ethers';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'DecentraX Security Gateway', timestamp: new Date().toISOString() });
});

// Ensure local IPFS storage cache directory exists
const IPFS_STORAGE_DIR = process.env.VERCEL
  ? path.join('/tmp', 'ipfs')
  : path.join(__dirname, 'storage', 'ipfs');

if (!fs.existsSync(IPFS_STORAGE_DIR)) {
  fs.mkdirSync(IPFS_STORAGE_DIR, { recursive: true });
}

// In-memory / file-persisted audit log index
const AUDIT_LOG_FILE = process.env.VERCEL
  ? path.join('/tmp', 'audit_logs.json')
  : path.join(__dirname, 'storage', 'audit_logs.json');
let auditLogsCache = [];

if (fs.existsSync(AUDIT_LOG_FILE)) {
  try {
    const raw = fs.readFileSync(AUDIT_LOG_FILE, 'utf-8');
    auditLogsCache = JSON.parse(raw);
  } catch (err) {
    auditLogsCache = [];
  }
}

function persistAuditLog(entry) {
  auditLogsCache.unshift(entry);
  if (auditLogsCache.length > 500) {
    auditLogsCache = auditLogsCache.slice(0, 500);
  }
  try {
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(auditLogsCache, null, 2));
  } catch (err) {
    console.error('Failed to persist audit log:', err);
  }
}

// Utility to generate a deterministic IPFS v0-like base58 CID from content buffer
function generateMockCID(buffer) {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  // Return standard IPFS prefix with hash representation
  return 'QmDX' + hash.substring(0, 42);
}

// ==========================================
// 1. IPFS / PINATA INTEGRATION
// ==========================================

app.post('/api/ipfs/upload-metadata', async (req, res) => {
  try {
    const metadata = req.body;
    if (!metadata || !metadata.name) {
      return res.status(400).json({ error: 'Metadata must contain an asset name' });
    }

    const jsonString = JSON.stringify(metadata, null, 2);
    const buffer = Buffer.from(jsonString);

    let cid = '';
    let pinnedToPinata = false;

    // Check if Pinata JWT is configured
    if (process.env.PINATA_JWT) {
      try {
        const pinataRes = await axios.post(
          'https://api.pinata.cloud/pinning/pinJSONToIPFS',
          metadata,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.PINATA_JWT}`,
            },
          }
        );
        cid = pinataRes.data.IpfsHash;
        pinnedToPinata = true;
      } catch (pinataErr) {
        console.warn('Pinata API call failed or timed out, falling back to local IPFS store:', pinataErr.message);
      }
    }

    // Fallback: Deterministic CID and store locally
    if (!cid) {
      cid = generateMockCID(buffer);
    }

    // Always store a local copy for ultra-fast gateway access and offline testing
    const filePath = path.join(IPFS_STORAGE_DIR, `${cid}.json`);
    fs.writeFileSync(filePath, jsonString);

    return res.status(201).json({
      success: true,
      cid,
      pinnedToPinata,
      ipfsUri: `ipfs://${cid}`,
      gatewayUrl: `/api/ipfs/${cid}`,
      size: buffer.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('IPFS upload metadata error:', error);
    return res.status(500).json({ error: error.message || 'Internal IPFS upload error' });
  }
});

// Fetch pinned IPFS object
app.get('/api/ipfs/:cid', (req, res) => {
  const { cid } = req.params;
  const filePath = path.join(IPFS_STORAGE_DIR, `${cid}.json`);

  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      return res.send(data);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read IPFS record' });
    }
  }

  // If not in local storage and pinata is enabled, could proxy
  return res.status(404).json({ error: 'IPFS CID content not found on gateway' });
});

// ==========================================
// 2. AUTHENTICATION & CHALLENGE (EIP-4361 / EIP-191)
// ==========================================

const activeNonces = new Map();

app.post('/api/auth/challenge', (req, res) => {
  const { address } = req.body;
  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ error: 'Valid Ethereum address required' });
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = new Date().toISOString();
  const challengeMessage = `DecentraX Security Portal | Bharat Electronics Limited\nOrganization: Bharat Electronics Limited (BEL)\nProblem: SIH26125\nWallet: ${address.toLowerCase()}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

  activeNonces.set(address.toLowerCase(), { nonce, timestamp, challengeMessage });

  return res.json({
    address: address.toLowerCase(),
    nonce,
    message: challengeMessage,
  });
});

app.post('/api/auth/verify', (req, res) => {
  try {
    const { address, signature } = req.body;
    if (!address || !signature) {
      return res.status(400).json({ error: 'Address and signature are required' });
    }

    const storedChallenge = activeNonces.get(address.toLowerCase());
    if (!storedChallenge) {
      return res.status(400).json({ error: 'No active challenge found for this address. Request challenge first.' });
    }

    // Recover address from signature
    const recoveredAddress = ethers.verifyMessage(storedChallenge.message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Cryptographic signature verification failed' });
    }

    // Clear nonce after use
    activeNonces.delete(address.toLowerCase());

    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Record audit event for login
    persistAuditLog({
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      category: 'AUTH',
      action: 'WALLET_AUTHENTICATION',
      operator: address.toLowerCase(),
      subject: address.toLowerCase(),
      resourceId: 'SECURITY_GATEWAY',
      details: 'Cryptographic signature verified against challenge nonce',
      txHash: null,
      success: true,
    });

    return res.json({
      success: true,
      authenticated: true,
      address: address.toLowerCase(),
      sessionToken,
    });
  } catch (err) {
    console.error('Signature verification error:', err);
    return res.status(500).json({ error: err.message || 'Signature verification error' });
  }
});

// ==========================================
// 3. AUDIT TRAIL AGGREGATOR
// ==========================================

app.post('/api/audit/log', (req, res) => {
  const { category, action, operator, subject, resourceId, details, txHash, success } = req.body;

  if (!action || !operator) {
    return res.status(400).json({ error: 'Action and operator are required' });
  }

  const logEntry = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    category: category || 'SECURITY',
    action,
    operator: operator.toLowerCase(),
    subject: subject ? subject.toLowerCase() : operator.toLowerCase(),
    resourceId: resourceId || 'SYSTEM',
    details: details || '',
    txHash: txHash || null,
    success: success !== undefined ? success : true,
  };

  persistAuditLog(logEntry);
  return res.status(201).json({ success: true, log: logEntry });
});

app.get('/api/audit/logs', (req, res) => {
  const { category, action, wallet, search, limit = 100 } = req.query;

  let results = [...auditLogsCache];

  if (category && category !== 'ALL') {
    results = results.filter((item) => item.category.toUpperCase() === category.toUpperCase());
  }

  if (action && action !== 'ALL') {
    results = results.filter((item) => item.action.toUpperCase() === action.toUpperCase());
  }

  if (wallet) {
    const qWallet = wallet.toLowerCase();
    results = results.filter(
      (item) => item.operator.includes(qWallet) || (item.subject && item.subject.includes(qWallet))
    );
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (item) =>
        item.action.toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q) ||
        item.operator.toLowerCase().includes(q) ||
        (item.resourceId && item.resourceId.toLowerCase().includes(q)) ||
        (item.txHash && item.txHash.toLowerCase().includes(q))
    );
  }

  const parsedLimit = parseInt(limit, 10);
  return res.json({
    total: results.length,
    logs: results.slice(0, isNaN(parsedLimit) ? 100 : parsedLimit),
  });
});

// ==========================================
// 4. SYSTEM HEALTH & METADATA
// ==========================================

app.get('/api/system/health', (req, res) => {
  let contractsConfig = {};
  const configPath = path.join(__dirname, '..', 'contracts', 'deployed-addresses.json');
  if (fs.existsSync(configPath)) {
    try {
      contractsConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      // ignore
    }
  }

  return res.json({
    status: 'ONLINE',
    platform: 'DecentraX',
    organization: 'Bharat Electronics Limited (BEL)',
    hackathon: 'Smart India Hackathon 2026',
    problemStatement: 'SIH26125',
    theme: 'Blockchain & Cybersecurity',
    contracts: contractsConfig,
    networksSupported: ['Polygon Amoy (80002)', 'Local Hardhat Node (31337)'],
    storage: {
      type: 'IPFS / Local Gateway Hybrid',
      pinataConfigured: Boolean(process.env.PINATA_JWT),
    },
    serverTime: new Date().toISOString(),
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[DecentraX Security Gateway] Running on port ${PORT}`);
    console.log(`[DecentraX] IPFS Storage cache initialized at: ${IPFS_STORAGE_DIR}`);
  });
}

export default app;
