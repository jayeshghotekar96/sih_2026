// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./DecentraXAccessControl.sol";

/**
 * @title IdentityRegistry
 * @notice Decentralized Identity (DID) Registry for Bharat Electronics Limited (SIH26125)
 * @dev Maps wallet addresses to cryptographically verifiable identity records and DIDs.
 * Sensitive personnel PII remains off-chain; only cryptographic hashes, public metadata, and status flags reside on-chain.
 */
contract IdentityRegistry {
    DecentraXAccessControl public accessControl;

    struct Identity {
        string did; // did:decentrax:<address>
        string fullName;
        string department;
        string offchainHash; // SHA-256 hash of off-chain encrypted dossier
        bytes32 role;
        bool isVerified;
        bool isActive;
        uint256 registeredAt;
        uint256 updatedAt;
    }

    mapping(address => Identity) private identities;
    address[] private registeredAddresses;

    event IdentityRegistered(
        address indexed userAddress,
        string did,
        string fullName,
        string department,
        bytes32 role,
        uint256 timestamp
    );

    event IdentityStatusChanged(
        address indexed userAddress,
        bool isActive,
        address indexed operator,
        uint256 timestamp
    );

    event IdentityAttestationVerified(
        address indexed userAddress,
        address indexed auditor,
        string attestationNotes,
        uint256 timestamp
    );

    modifier onlyAdmin() {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "IdentityRegistry: Caller is not ADMIN"
        );
        _;
    }

    modifier onlyAuditorOrAdmin() {
        require(
            accessControl.hasRole(accessControl.AUDITOR_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "IdentityRegistry: Caller is not AUDITOR or ADMIN"
        );
        _;
    }

    constructor(address accessControlAddress) {
        require(accessControlAddress != address(0), "Invalid access control address");
        accessControl = DecentraXAccessControl(accessControlAddress);
    }

    /**
     * @notice Register a new identity into the DecentraX DID Registry
     */
    function registerIdentity(
        address userAddress,
        string calldata fullName,
        string calldata department,
        string calldata offchainHash,
        bytes32 role
    ) external onlyAdmin {
        require(userAddress != address(0), "Invalid user address");
        require(bytes(fullName).length > 0, "Full name required");
        require(bytes(identities[userAddress].did).length == 0, "Identity already registered");

        string memory didString = string(abi.encodePacked("did:decentrax:", toHexString(userAddress)));

        identities[userAddress] = Identity({
            did: didString,
            fullName: fullName,
            department: department,
            offchainHash: offchainHash,
            role: role,
            isVerified: true, // Registered by Admin = baseline verified
            isActive: true,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp
        });

        registeredAddresses.push(userAddress);

        // Assign the role in the access control contract if non-zero
        if (role != bytes32(0)) {
            accessControl.assignRole(role, userAddress);
        }

        emit IdentityRegistered(userAddress, didString, fullName, department, role, block.timestamp);
    }

    /**
     * @notice Suspend or reactivate an identity
     */
    function setIdentityActiveStatus(address userAddress, bool isActive) external onlyAdmin {
        require(bytes(identities[userAddress].did).length > 0, "Identity does not exist");
        identities[userAddress].isActive = isActive;
        identities[userAddress].updatedAt = block.timestamp;

        emit IdentityStatusChanged(userAddress, isActive, msg.sender, block.timestamp);
    }

    /**
     * @notice Auditor attestation of identity credentials
     */
    function verifyIdentityAttestation(address userAddress, string calldata notes) external onlyAuditorOrAdmin {
        require(bytes(identities[userAddress].did).length > 0, "Identity does not exist");
        identities[userAddress].isVerified = true;
        identities[userAddress].updatedAt = block.timestamp;

        emit IdentityAttestationVerified(userAddress, msg.sender, notes, block.timestamp);
    }

    /**
     * @notice Get identity details for an address
     */
    function getIdentity(address userAddress) external view returns (Identity memory) {
        require(bytes(identities[userAddress].did).length > 0, "Identity not registered");
        return identities[userAddress];
    }

    /**
     * @notice Check whether an identity is registered and active
     */
    function hasActiveIdentity(address userAddress) external view returns (bool) {
        return bytes(identities[userAddress].did).length > 0 && identities[userAddress].isActive;
    }

    /**
     * @notice Return total registered identities count
     */
    function totalIdentities() external view returns (uint256) {
        return registeredAddresses.length;
    }

    /**
     * @notice Return all registered addresses for directory listings
     */
    function getAllRegisteredAddresses() external view returns (address[] memory) {
        return registeredAddresses;
    }

    /**
     * @dev Helper to convert address to hex string
     */
    function toHexString(address account) internal pure returns (string memory) {
        bytes20 data = bytes20(account);
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        bytes memory alphabet = "0123456789abcdef";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}
