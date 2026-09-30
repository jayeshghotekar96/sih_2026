export type Role = 'ADMIN' | 'MANAGER' | 'AUDITOR' | 'USER' | 'UNASSIGNED';

export type AssetType = 
  | 'TACTICAL_HARDWARE'
  | 'CRYPTO_KEYPAIR'
  | 'DEFENCE_DOCUMENT'
  | 'COMMUNICATION_CODE'
  | 'SURVEILLANCE_SYSTEM'
  | 'RADAR_SYSTEM'
  | 'DRONE_FIRMWARE';

export type ClassificationLevel = 
  | 'UNCLASSIFIED'
  | 'RESTRICTED'
  | 'CONFIDENTIAL'
  | 'SECRET'
  | 'TOP_SECRET';

export type AssetStatus = 
  | 'CREATED'
  | 'ALLOCATED'
  | 'IN_TRANSIT'
  | 'AUDITED'
  | 'DECOMMISSIONED';

export interface Identity {
  did: string;
  wallet: string;
  fullName: string;
  department: string;
  offchainHash: string;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  registeredAt: number;
  updatedAt: number;
  txHash?: string;
}

export interface Asset {
  tokenId: number;
  assetName: string;
  assetType: AssetType;
  description: string;
  metadataCID: string;
  classificationLevel: ClassificationLevel;
  custodian: string;
  createdBy: string;
  createdAt: number;
  lastUpdated: number;
  status: AssetStatus;
  txHash?: string;
  metadata?: any;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  category: 'IDENTITY' | 'ACCESS' | 'ASSET' | 'AUTH' | 'SECURITY' | 'SYSTEM';
  action: string;
  operator: string;
  subject: string;
  resourceId: string;
  details: string;
  txHash: string | null;
  success: boolean;
}

export interface Web3State {
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  role: Role;
  identity: Identity | null;
  isCorrectNetwork: boolean;
}

export interface PermissionEvaluationResult {
  granted: boolean;
  reason: string;
  role: Role;
  resource: string;
  action: string;
  evaluatedAt: string;
  txHash?: string;
}
