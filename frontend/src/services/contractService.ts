import { ethers, Contract } from 'ethers';
import deployedConfig from '../contracts/deployed-contracts.json';
import contractAbis from '../contracts/contract-abis.json';
import { Identity, Asset, Role } from '../types';

export const CONTRACT_ADDRESSES = {
  accessControl: deployedConfig.contracts.DecentraXAccessControl,
  identityRegistry: deployedConfig.contracts.IdentityRegistry,
  assetNFT: deployedConfig.contracts.AssetNFT,
  auditLogger: deployedConfig.contracts.DecentraXAuditLogger,
};

export const ROLE_HASHES: Record<string, string> = {
  ADMIN: ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")),
  MANAGER: ethers.keccak256(ethers.toUtf8Bytes("MANAGER_ROLE")),
  AUDITOR: ethers.keccak256(ethers.toUtf8Bytes("AUDITOR_ROLE")),
  USER: ethers.keccak256(ethers.toUtf8Bytes("USER_ROLE")),
};

export const ROLE_FROM_HASH: Record<string, Role> = {
  [ROLE_HASHES.ADMIN]: 'ADMIN',
  [ROLE_HASHES.MANAGER]: 'MANAGER',
  [ROLE_HASHES.AUDITOR]: 'AUDITOR',
  [ROLE_HASHES.USER]: 'USER',
};

// Fallback provider for local node read operations
let fallbackProvider: ethers.JsonRpcProvider | null = null;
export function getLocalProvider() {
  if (!fallbackProvider) {
    fallbackProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  }
  return fallbackProvider;
}

export function getContract(name: 'DecentraXAccessControl' | 'IdentityRegistry' | 'AssetNFT' | 'DecentraXAuditLogger', runner: ethers.ContractRunner) {
  let address = '';
  if (name === 'DecentraXAccessControl') address = CONTRACT_ADDRESSES.accessControl;
  else if (name === 'IdentityRegistry') address = CONTRACT_ADDRESSES.identityRegistry;
  else if (name === 'AssetNFT') address = CONTRACT_ADDRESSES.assetNFT;
  else if (name === 'DecentraXAuditLogger') address = CONTRACT_ADDRESSES.auditLogger;

  const abi = (contractAbis as any)[name];
  if (!abi) {
    throw new Error(`ABI for ${name} not found in artifacts`);
  }
  return new Contract(address, abi, runner);
}

export const contractService = {
  // Fetch Identity for an address (with fallback to local node if MetaMask is on wrong chain)
  getIdentity: async (address: string, runner?: ethers.ContractRunner): Promise<Identity | null> => {
    const executeQuery = async (activeRunner: ethers.ContractRunner) => {
      const contract = getContract('IdentityRegistry', activeRunner);
      const hasIdentity = await contract.hasActiveIdentity(address).catch(() => false);
      if (!hasIdentity) {
        const raw = await contract.getIdentity(address).catch(() => null);
        if (!raw || !raw.did) return null;
        return {
          did: raw.did,
          wallet: address,
          fullName: raw.fullName,
          department: raw.department,
          offchainHash: raw.offchainHash,
          role: ROLE_FROM_HASH[raw.role] || 'USER',
          isVerified: raw.isVerified,
          isActive: raw.isActive,
          registeredAt: Number(raw.registeredAt),
          updatedAt: Number(raw.updatedAt),
        };
      }

      const raw = await contract.getIdentity(address);
      return {
        did: raw.did,
        wallet: address,
        fullName: raw.fullName,
        department: raw.department,
        offchainHash: raw.offchainHash,
        role: ROLE_FROM_HASH[raw.role] || 'USER',
        isVerified: raw.isVerified,
        isActive: raw.isActive,
        registeredAt: Number(raw.registeredAt),
        updatedAt: Number(raw.updatedAt),
      };
    };

    try {
      if (runner) {
        return await executeQuery(runner);
      }
    } catch (err) {
      // Runner failed (e.g. wrong chain in MetaMask), fallback to local node
    }

    try {
      return await executeQuery(getLocalProvider());
    } catch (err) {
      return null;
    }
  },

  // Fetch primary role for address (with fallback)
  getRole: async (address: string, runner?: ethers.ContractRunner): Promise<Role> => {
    const executeQuery = async (activeRunner: ethers.ContractRunner) => {
      const contract = getContract('DecentraXAccessControl', activeRunner);
      const roleStr = await contract.getPrimaryRole(address);
      if (['ADMIN', 'MANAGER', 'AUDITOR', 'USER'].includes(roleStr)) {
        return roleStr as Role;
      }
      return 'UNASSIGNED';
    };

    try {
      if (runner) {
        return await executeQuery(runner);
      }
    } catch (err) {
      // Runner failed, fallback to local node
    }

    try {
      return await executeQuery(getLocalProvider());
    } catch (err) {
      return 'UNASSIGNED';
    }
  },

  // Register a new identity
  registerIdentity: async (
    userAddress: string,
    fullName: string,
    department: string,
    offchainHash: string,
    role: Role,
    signer: ethers.Signer
  ) => {
    const contract = getContract('IdentityRegistry', signer);
    const roleHash = ROLE_HASHES[role] || ROLE_HASHES.USER;
    const tx = await contract.registerIdentity(
      userAddress,
      fullName,
      department,
      offchainHash,
      roleHash
    );
    const receipt = await tx.wait();
    return { receipt, txHash: receipt.hash };
  },

  // Suspend / activate identity
  setIdentityActiveStatus: async (userAddress: string, isActive: boolean, signer: ethers.Signer) => {
    const contract = getContract('IdentityRegistry', signer);
    const tx = await contract.setIdentityActiveStatus(userAddress, isActive);
    const receipt = await tx.wait();
    return { receipt, txHash: receipt.hash };
  },

  // Attest / verify identity by Auditor
  attestIdentity: async (userAddress: string, notes: string, signer: ethers.Signer) => {
    const contract = getContract('IdentityRegistry', signer);
    const tx = await contract.verifyIdentityAttestation(userAddress, notes);
    const receipt = await tx.wait();
    return { receipt, txHash: receipt.hash };
  },

  // Assign role
  assignRole: async (role: Role, account: string, signer: ethers.Signer) => {
    const contract = getContract('DecentraXAccessControl', signer);
    const roleHash = ROLE_HASHES[role];
    if (!roleHash) throw new Error(`Invalid role ${role}`);
    const tx = await contract.assignRole(roleHash, account);
    const receipt = await tx.wait();
    return { receipt, txHash: receipt.hash };
  },

  // Revoke role
  revokeRole: async (role: Role, account: string, signer: ethers.Signer) => {
    const contract = getContract('DecentraXAccessControl', signer);
    const roleHash = ROLE_HASHES[role];
    if (!roleHash) throw new Error(`Invalid role ${role}`);
    const tx = await contract.revokeRole(roleHash, account);
    const receipt = await tx.wait();
    return { receipt, txHash: receipt.hash };
  },

  // Mint Digital Asset (ERC-721)
  mintAsset: async (
    assetName: string,
    assetType: string,
    description: string,
    metadataCID: string,
    classificationLevel: string,
    initialCustodian: string,
    signer: ethers.Signer
  ) => {
    const contract = getContract('AssetNFT', signer);
    const tx = await contract.mintAsset(
      assetName,
      assetType,
      description,
      metadataCID,
      classificationLevel,
      initialCustodian
    );
    const receipt = await tx.wait();

    let tokenId = 1;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === 'AssetMinted') {
          tokenId = Number(parsed.args.tokenId);
          break;
        }
      } catch (e) {
        // ignore
      }
    }

    return { receipt, txHash: receipt.hash, tokenId };
  },

  // Reallocate asset custody
  allocateAsset: async (tokenId: number, newCustodian: string, remarks: string, signer: ethers.Signer) => {
    const contract = getContract('AssetNFT', signer);
    const tx = await contract.allocateAsset(tokenId, newCustodian, remarks);
    const receipt = await tx.wait();
    return { receipt, txHash: receipt.hash };
  },

  // Audit / attest asset
  auditAsset: async (tokenId: number, passed: boolean, notes: string, signer: ethers.Signer) => {
    const contract = getContract('AssetNFT', signer);
    const tx = await contract.recordAudit(tokenId, passed, notes);
    const receipt = await tx.wait();
    return { receipt, txHash: receipt.hash };
  },

  // Evaluate access
  evaluateAccess: async (
    userAddress: string,
    resource: string,
    action: string,
    runner: ethers.ContractRunner
  ): Promise<{ granted: boolean; reason: string }> => {
    try {
      const contract = getContract('DecentraXAccessControl', runner);
      if (typeof contract.evaluateAccess?.staticCall === 'function') {
        const [granted, reason] = await contract.evaluateAccess.staticCall(userAddress, resource, action);
        return { granted, reason };
      }
      const [granted, reason] = await contract.evaluateAccess(userAddress, resource, action);
      return { granted, reason };
    } catch (err: any) {
      // Try local fallback
      try {
        const localContract = getContract('DecentraXAccessControl', getLocalProvider());
        const [granted, reason] = await localContract.evaluateAccess.staticCall(userAddress, resource, action);
        return { granted, reason };
      } catch (fallbackErr: any) {
        return { granted: false, reason: fallbackErr.reason || fallbackErr.message || 'Access Denied' };
      }
    }
  },

  // Get asset by Token ID
  getAsset: async (tokenId: number, runner?: ethers.ContractRunner): Promise<Asset | null> => {
    const executeQuery = async (activeRunner: ethers.ContractRunner) => {
      const contract = getContract('AssetNFT', activeRunner);
      const raw = await contract.getAsset(tokenId);
      return {
        tokenId: Number(raw.tokenId),
        assetName: raw.assetName,
        assetType: raw.assetType,
        description: raw.description,
        metadataCID: raw.metadataCID,
        classificationLevel: raw.classificationLevel,
        custodian: raw.custodian,
        createdBy: raw.custodian || '',
        createdAt: Number(raw.createdAt) * 1000,
        lastUpdated: Number(raw.createdAt) * 1000,
        status: raw.status,
      };
    };

    try {
      if (runner) return await executeQuery(runner);
    } catch (e) {
      // Fallback
    }

    try {
      return await executeQuery(getLocalProvider());
    } catch (err) {
      return null;
    }
  },

  // Get all assets
  getAllAssets: async (runner?: ethers.ContractRunner): Promise<Asset[]> => {
    const executeQuery = async (activeRunner: ethers.ContractRunner) => {
      const contract = getContract('AssetNFT', activeRunner);
      const tokenIds = await contract.getAllTokenIds();
      const assets: Asset[] = [];
      for (const id of tokenIds) {
        const a = await contractService.getAsset(Number(id), activeRunner);
        if (a) assets.push(a);
      }
      return assets;
    };

    try {
      if (runner) return await executeQuery(runner);
    } catch (e) {
      // Fallback
    }

    try {
      return await executeQuery(getLocalProvider());
    } catch (err) {
      return [];
    }
  },

  // Get all registered identities
  getAllIdentities: async (runner?: ethers.ContractRunner): Promise<Identity[]> => {
    const executeQuery = async (activeRunner: ethers.ContractRunner) => {
      const contract = getContract('IdentityRegistry', activeRunner);
      const addresses: string[] = await contract.getAllRegisteredAddresses();
      const identities: Identity[] = [];
      for (const addr of addresses) {
        const id = await contractService.getIdentity(addr, activeRunner);
        if (id) identities.push(id);
      }
      return identities;
    };

    try {
      if (runner) return await executeQuery(runner);
    } catch (e) {
      // Fallback
    }

    try {
      return await executeQuery(getLocalProvider());
    } catch (err) {
      return [];
    }
  },

  // Record audit log event on-chain
  recordOnChainAudit: async (
    category: string,
    action: string,
    subject: string,
    resourceId: string,
    details: string,
    success: boolean,
    signer: ethers.Signer
  ) => {
    try {
      const contract = getContract('DecentraXAuditLogger', signer);
      const tx = await contract.recordEvent(category, action, subject, resourceId, details, success);
      const receipt = await tx.wait();
      return { receipt, txHash: receipt.hash };
    } catch (err) {
      console.warn('Failed to record on-chain audit event:', err);
      return null;
    }
  },
};
