// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./DecentraXAccessControl.sol";
import "./IdentityRegistry.sol";

/**
 * @title AssetNFT
 * @notice ERC-721 based Verifiable Digital Record for Physical & Digital Assets
 * @dev Organization: Bharat Electronics Limited (SIH26125)
 * Represents verifiable custody, technical provenance, and IPFS metadata links.
 * Explicit disclaimer: This NFT serves as a verifiable cryptographic audit trail and custody tracking record.
 */
contract AssetNFT is ERC721URIStorage {
    DecentraXAccessControl public accessControl;
    IdentityRegistry public identityRegistry;

    uint256 private _nextTokenId;

    enum AssetStatus {
        CREATED,
        ALLOCATED,
        IN_TRANSIT,
        AUDITED,
        DECOMMISSIONED
    }

    struct AssetRecord {
        uint256 tokenId;
        string assetName;
        string assetType;
        string description;
        string metadataCID;
        string classificationLevel;
        address custodian;
        address createdBy;
        uint256 createdAt;
        uint256 lastUpdated;
        AssetStatus status;
    }

    mapping(uint256 => AssetRecord) private _assets;
    uint256[] private _allTokenIds;

    // Events for immutable chain-of-custody audit trail
    event AssetMinted(
        uint256 indexed tokenId,
        string assetName,
        string assetType,
        string metadataCID,
        address indexed custodian,
        address indexed createdBy,
        uint256 timestamp
    );

    event AssetAllocated(
        uint256 indexed tokenId,
        address indexed previousCustodian,
        address indexed newCustodian,
        string remarks,
        uint256 timestamp
    );

    event AssetTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    event AssetAudited(
        uint256 indexed tokenId,
        address indexed auditor,
        bool isCompliant,
        string remarks,
        uint256 timestamp
    );

    event AssetStatusUpdated(
        uint256 indexed tokenId,
        AssetStatus previousStatus,
        AssetStatus newStatus,
        address indexed operator,
        uint256 timestamp
    );

    modifier onlyManagerOrAdmin() {
        require(
            accessControl.hasRole(accessControl.MANAGER_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "AssetNFT: Caller is not MANAGER or ADMIN"
        );
        _;
    }

    modifier onlyAuditorOrAdmin() {
        require(
            accessControl.hasRole(accessControl.AUDITOR_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "AssetNFT: Caller is not AUDITOR or ADMIN"
        );
        _;
    }

    constructor(address accessControlAddress, address identityRegistryAddress)
        ERC721("DecentraX Defence Asset", "DXASSET")
    {
        require(accessControlAddress != address(0), "Invalid access control address");
        require(identityRegistryAddress != address(0), "Invalid identity registry address");
        accessControl = DecentraXAccessControl(accessControlAddress);
        identityRegistry = IdentityRegistry(identityRegistryAddress);
        _nextTokenId = 1;
    }

    /**
     * @notice Mint a new verifiable asset token with IPFS metadata link
     */
    function mintAsset(
        string calldata assetName,
        string calldata assetType,
        string calldata description,
        string calldata metadataCID,
        string calldata classificationLevel,
        address initialCustodian
    ) external onlyManagerOrAdmin returns (uint256) {
        require(bytes(assetName).length > 0, "Asset name required");
        require(bytes(metadataCID).length > 0, "Metadata CID required");
        require(initialCustodian != address(0), "Invalid custodian address");

        // Verify recipient has registered identity in DecentraX
        require(
            identityRegistry.hasActiveIdentity(initialCustodian),
            "AssetNFT: Custodian must have active registered identity"
        );

        uint256 tokenId = _nextTokenId++;
        _safeMint(initialCustodian, tokenId);
        
        string memory tokenURI = string(abi.encodePacked("ipfs://", metadataCID));
        _setTokenURI(tokenId, tokenURI);

        _assets[tokenId] = AssetRecord({
            tokenId: tokenId,
            assetName: assetName,
            assetType: assetType,
            description: description,
            metadataCID: metadataCID,
            classificationLevel: classificationLevel,
            custodian: initialCustodian,
            createdBy: msg.sender,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            status: AssetStatus.CREATED
        });

        _allTokenIds.push(tokenId);

        emit AssetMinted(
            tokenId,
            assetName,
            assetType,
            metadataCID,
            initialCustodian,
            msg.sender,
            block.timestamp
        );

        return tokenId;
    }

    /**
     * @notice Allocate / Reassign custody of an asset to another verified identity
     */
    function allocateAsset(
        uint256 tokenId,
        address newCustodian,
        string calldata remarks
    ) external onlyManagerOrAdmin {
        require(_ownerOf(tokenId) != address(0), "Asset does not exist");
        require(newCustodian != address(0), "Invalid new custodian");
        require(
            identityRegistry.hasActiveIdentity(newCustodian),
            "AssetNFT: New custodian must possess verified active identity"
        );

        address previousCustodian = _assets[tokenId].custodian;
        _assets[tokenId].custodian = newCustodian;
        _assets[tokenId].status = AssetStatus.ALLOCATED;
        _assets[tokenId].lastUpdated = block.timestamp;

        // Transfer ERC-721 ownership to maintain 1:1 parity with custody
        if (ownerOf(tokenId) != newCustodian) {
            _transfer(ownerOf(tokenId), newCustodian, tokenId);
        }

        emit AssetAllocated(tokenId, previousCustodian, newCustodian, remarks, block.timestamp);
    }

    /**
     * @notice Verify and audit an asset record on-chain
     */
    function auditAsset(
        uint256 tokenId,
        bool isCompliant,
        string calldata remarks
    ) external onlyAuditorOrAdmin {
        require(_ownerOf(tokenId) != address(0), "Asset does not exist");
        _assets[tokenId].lastUpdated = block.timestamp;
        _assets[tokenId].status = AssetStatus.AUDITED;

        emit AssetAudited(tokenId, msg.sender, isCompliant, remarks, block.timestamp);
    }

    /**
     * @notice Update asset status
     */
    function setAssetStatus(uint256 tokenId, AssetStatus newStatus) external onlyManagerOrAdmin {
        require(_ownerOf(tokenId) != address(0), "Asset does not exist");
        AssetStatus prev = _assets[tokenId].status;
        _assets[tokenId].status = newStatus;
        _assets[tokenId].lastUpdated = block.timestamp;

        emit AssetStatusUpdated(tokenId, prev, newStatus, msg.sender, block.timestamp);
    }

    /**
     * @notice Retrieve asset details
     */
    function getAsset(uint256 tokenId) external view returns (AssetRecord memory) {
        require(_ownerOf(tokenId) != address(0), "Asset does not exist");
        return _assets[tokenId];
    }

    /**
     * @notice Get all minted token IDs
     */
    function getAllTokenIds() external view returns (uint256[] memory) {
        return _allTokenIds;
    }

    /**
     * @notice Total assets count
     */
    function totalAssets() external view returns (uint256) {
        return _allTokenIds.length;
    }
}
