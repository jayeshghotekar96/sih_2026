const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DecentraX Platform Suite (SIH26125 - Bharat Electronics Limited)", function () {
  let accessControl;
  let identityRegistry;
  let assetNFT;
  let auditLogger;
  let deployer, manager, auditor, user, unauthorized;

  let ADMIN_ROLE, MANAGER_ROLE, AUDITOR_ROLE, USER_ROLE;

  before(async function () {
    [deployer, manager, auditor, user, unauthorized] = await ethers.getSigners();

    // 1. Deploy AccessControl
    const AccessControlFactory = await ethers.getContractFactory("DecentraXAccessControl");
    accessControl = await AccessControlFactory.deploy(deployer.address);
    await accessControl.waitForDeployment();

    ADMIN_ROLE = await accessControl.ADMIN_ROLE();
    MANAGER_ROLE = await accessControl.MANAGER_ROLE();
    AUDITOR_ROLE = await accessControl.AUDITOR_ROLE();
    USER_ROLE = await accessControl.USER_ROLE();

    // 2. Deploy IdentityRegistry
    const IdentityRegistryFactory = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistryFactory.deploy(await accessControl.getAddress());
    await identityRegistry.waitForDeployment();

    // Grant ADMIN_ROLE to IdentityRegistry for automatic role provisioning
    await accessControl.grantRole(ADMIN_ROLE, await identityRegistry.getAddress());

    // 3. Deploy AssetNFT
    const AssetNFTFactory = await ethers.getContractFactory("AssetNFT");
    assetNFT = await AssetNFTFactory.deploy(
      await accessControl.getAddress(),
      await identityRegistry.getAddress()
    );
    await assetNFT.waitForDeployment();

    // 4. Deploy AuditLogger
    const AuditLoggerFactory = await ethers.getContractFactory("DecentraXAuditLogger");
    auditLogger = await AuditLoggerFactory.deploy(await accessControl.getAddress());
    await auditLogger.waitForDeployment();
  });

  describe("1. Access Control & Role Management", function () {
    it("Deployer should possess ADMIN_ROLE", async function () {
      expect(await accessControl.hasRole(ADMIN_ROLE, deployer.address)).to.be.true;
      expect(await accessControl.getPrimaryRole(deployer.address)).to.equal("ADMIN");
    });

    it("Admin can assign and revoke MANAGER_ROLE", async function () {
      await accessControl.assignRole(MANAGER_ROLE, manager.address);
      expect(await accessControl.hasRole(MANAGER_ROLE, manager.address)).to.be.true;
      expect(await accessControl.getPrimaryRole(manager.address)).to.equal("MANAGER");

      // Revoke and re-assign for remaining tests
      await accessControl.revokeUserRole(MANAGER_ROLE, manager.address);
      expect(await accessControl.hasRole(MANAGER_ROLE, manager.address)).to.be.false;

      await accessControl.assignRole(MANAGER_ROLE, manager.address);
      expect(await accessControl.hasRole(MANAGER_ROLE, manager.address)).to.be.true;
    });

    it("Non-admin cannot assign roles", async function () {
      await expect(
        accessControl.connect(unauthorized).assignRole(USER_ROLE, unauthorized.address)
      ).to.be.reverted;
    });

    it("On-chain evaluateAccess should permit Manager for asset creation and deny unauthorized", async function () {
      // Manager should be granted
      const tx = await accessControl.evaluateAccess(manager.address, "ASSETS", "CREATE_ASSET");
      await tx.wait();

      // Unauthorized should be denied
      const tx2 = await accessControl.evaluateAccess(unauthorized.address, "ASSETS", "CREATE_ASSET");
      await tx2.wait();
    });
  });

  describe("2. Decentralized Identity (DID) Registry", function () {
    it("Admin can register identity with DID and role", async function () {
      await identityRegistry.registerIdentity(
        user.address,
        "Sub-Lt. Arjun Nair",
        "Naval Tactical Systems - BEL",
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        USER_ROLE
      );

      const identity = await identityRegistry.getIdentity(user.address);
      expect(identity.fullName).to.equal("Sub-Lt. Arjun Nair");
      expect(identity.department).to.equal("Naval Tactical Systems - BEL");
      expect(identity.isActive).to.be.true;
      expect(identity.isVerified).to.be.true;
      expect(identity.did).to.include("did:decentrax:");

      // Verify that the role was assigned
      expect(await accessControl.hasRole(USER_ROLE, user.address)).to.be.true;
    });

    it("Cannot register duplicate identity for same address", async function () {
      await expect(
        identityRegistry.registerIdentity(
          user.address,
          "Duplicate Test",
          "Dept",
          "0x1111",
          USER_ROLE
        )
      ).to.be.revertedWith("Identity already registered");
    });

    it("Admin can suspend and reactivate identity status", async function () {
      await identityRegistry.setIdentityActiveStatus(user.address, false);
      let identity = await identityRegistry.getIdentity(user.address);
      expect(identity.isActive).to.be.false;
      expect(await identityRegistry.hasActiveIdentity(user.address)).to.be.false;

      // Reactivate
      await identityRegistry.setIdentityActiveStatus(user.address, true);
      identity = await identityRegistry.getIdentity(user.address);
      expect(identity.isActive).to.be.true;
      expect(await identityRegistry.hasActiveIdentity(user.address)).to.be.true;
    });
  });

  describe("3. Digital Asset Management (ERC-721)", function () {
    it("Manager can mint an asset to a verified identity", async function () {
      // First ensure manager has registered identity too
      await identityRegistry.registerIdentity(
        manager.address,
        "Dr. Ananya Roy",
        "Avionics & Radar Systems - BEL",
        "0xaabbccdd",
        MANAGER_ROLE
      );

      const tx = await assetNFT.connect(manager).mintAsset(
        "BEL-TRX-900 Radar Transceiver",
        "TACTICAL_HARDWARE",
        "Phased array radar unit with secure telemetry.",
        "QmDX9a8f27cb4841961e6191c95b42cf431a49479b4a1f",
        "SECRET",
        user.address
      );
      await tx.wait();

      expect(await assetNFT.totalAssets()).to.equal(1);
      const asset = await assetNFT.getAsset(1);
      expect(asset.assetName).to.equal("BEL-TRX-900 Radar Transceiver");
      expect(asset.custodian).to.equal(user.address);
      expect(asset.metadataCID).to.equal("QmDX9a8f27cb4841961e6191c95b42cf431a49479b4a1f");
      expect(await assetNFT.ownerOf(1)).to.equal(user.address);
    });

    it("Unauthorized account cannot mint an asset", async function () {
      await expect(
        assetNFT.connect(unauthorized).mintAsset(
          "Rogue Asset",
          "HARDWARE",
          "Description",
          "QmRogueCID",
          "CONFIDENTIAL",
          unauthorized.address
        )
      ).to.be.revertedWith("AssetNFT: Caller is not MANAGER or ADMIN");
    });

    it("Cannot mint asset to an unregistered address", async function () {
      await expect(
        assetNFT.connect(manager).mintAsset(
          "Unregistered Recipient Asset",
          "HARDWARE",
          "Description",
          "QmValidCID",
          "CONFIDENTIAL",
          unauthorized.address
        )
      ).to.be.revertedWith("AssetNFT: Custodian must have active registered identity");
    });

    it("Manager can reallocate asset custody", async function () {
      await assetNFT.connect(manager).allocateAsset(1, manager.address, "Reallocated for scheduled recalibration");
      const asset = await assetNFT.getAsset(1);
      expect(asset.custodian).to.equal(manager.address);
      expect(await assetNFT.ownerOf(1)).to.equal(manager.address);
    });
  });

  describe("4. Audit Logger", function () {
    it("Records security events and retrieves them", async function () {
      const tx = await auditLogger.recordEvent(
        "ASSET",
        "ASSET_ALLOCATED",
        user.address,
        "ASSET_1",
        "Transferred custody from Field Officer to Systems Engineer",
        true
      );
      await tx.wait();

      expect(await auditLogger.totalRecords()).to.equal(1);
      const recent = await auditLogger.getRecentRecords(10);
      expect(recent.length).to.equal(1);
      expect(recent[0].action).to.equal("ASSET_ALLOCATED");
      expect(recent[0].category).to.equal("ASSET");
      expect(recent[0].success).to.be.true;
    });
  });
});
