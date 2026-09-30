const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("  DecentraX Contract Deployment (BEL - SIH26125)  ");
  console.log("==================================================");

  const [deployer, manager, auditor, user] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} ETH`);

  // 1. Deploy or Attach DecentraXAccessControl
  console.log("\n[1/4] Checking/Deploying DecentraXAccessControl...");
  const AccessControlFactory = await hre.ethers.getContractFactory("DecentraXAccessControl");
  let accessControl;
  let accessControlAddress = process.env.ACCESS_CONTROL_ADDRESS;

  if (hre.network.name === "amoy" && !accessControlAddress) {
    // Check known deployed contract from previous run
    const knownAddress = "0x1d1d0957476A63fFfA4B43Ea22F7fA1DC816A57D";
    const code = await hre.ethers.provider.getCode(knownAddress);
    if (code && code !== "0x") {
      accessControlAddress = knownAddress;
      console.log(`✓ Reusing already deployed DecentraXAccessControl at: ${accessControlAddress}`);
    }
  }

  if (accessControlAddress) {
    accessControl = AccessControlFactory.attach(accessControlAddress);
  } else {
    accessControl = await AccessControlFactory.deploy(deployer.address);
    await accessControl.waitForDeployment();
    accessControlAddress = await accessControl.getAddress();
    console.log(`✓ DecentraXAccessControl deployed at: ${accessControlAddress}`);
  }

  // 2. Deploy IdentityRegistry
  console.log("\n[2/4] Deploying IdentityRegistry...");
  const IdentityRegistryFactory = await hre.ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistryFactory.deploy(accessControlAddress);
  await identityRegistry.waitForDeployment();
  const identityRegistryAddress = await identityRegistry.getAddress();
  console.log(`✓ IdentityRegistry deployed at: ${identityRegistryAddress}`);

  // Grant ADMIN_ROLE to IdentityRegistry on AccessControl so it can assign initial roles upon registration
  const ADMIN_ROLE = await accessControl.ADMIN_ROLE();
  const grantTx = await accessControl.grantRole(ADMIN_ROLE, identityRegistryAddress);
  await grantTx.wait();
  console.log(`✓ Granted ADMIN_ROLE to IdentityRegistry for automatic role provisioning`);

  // 3. Deploy AssetNFT
  console.log("\n[3/4] Deploying AssetNFT...");
  const AssetNFTFactory = await hre.ethers.getContractFactory("AssetNFT");
  const assetNFT = await AssetNFTFactory.deploy(accessControlAddress, identityRegistryAddress);
  await assetNFT.waitForDeployment();
  const assetNFTAddress = await assetNFT.getAddress();
  console.log(`✓ AssetNFT deployed at: ${assetNFTAddress}`);

  // 4. Deploy DecentraXAuditLogger
  console.log("\n[4/4] Deploying DecentraXAuditLogger...");
  const AuditLoggerFactory = await hre.ethers.getContractFactory("DecentraXAuditLogger");
  const auditLogger = await AuditLoggerFactory.deploy(accessControlAddress);
  await auditLogger.waitForDeployment();
  const auditLoggerAddress = await auditLogger.getAddress();
  console.log(`✓ DecentraXAuditLogger deployed at: ${auditLoggerAddress}`);

  // ==========================================
  // SEED INITIAL DEFENCE DATA (IF LOCAL/DEV)
  // ==========================================
  console.log("\n--- Seeding Initial Verified Defence Identities & Roles ---");

  // Register Admin Identity
  const adminTx = await identityRegistry.registerIdentity(
    deployer.address,
    "Col. Rajesh Sharma (Director General)",
    "Strategic Electronic Defense - BEL HQ",
    "0x98f82736184519bc16518175e182937501726514930182740192837461928374",
    ADMIN_ROLE
  );
  await adminTx.wait();
  console.log(`✓ Admin identity registered for ${deployer.address}`);

  const MANAGER_ROLE = await accessControl.MANAGER_ROLE();
  const AUDITOR_ROLE = await accessControl.AUDITOR_ROLE();
  const USER_ROLE = await accessControl.USER_ROLE();

  if (manager) {
    // Register Manager
    const mgrTx = await identityRegistry.registerIdentity(
      manager.address,
      "Dr. Ananya Roy (Chief Systems Engineer)",
      "Avionics & Radar Systems Division - BEL",
      "0x12a8374619283746192837461928374619283746192837461928374619283746",
      MANAGER_ROLE
    );
    await mgrTx.wait();
    console.log(`✓ Manager identity & role assigned to ${manager.address}`);
  }

  if (auditor) {
    // Register Auditor
    const audTx = await identityRegistry.registerIdentity(
      auditor.address,
      "Vikramaditya Rao (Chief Inspector)",
      "Quality Assurance & Cryptographic Audit - BEL",
      "0x34b8374619283746192837461928374619283746192837461928374619283746",
      AUDITOR_ROLE
    );
    await audTx.wait();
    console.log(`✓ Auditor identity & role assigned to ${auditor.address}`);
  }

  if (user) {
    // Register User
    const usrTx = await identityRegistry.registerIdentity(
      user.address,
      "Sub-Lt. Arjun Nair (Field Tactical Officer)",
      "Naval Operations & Electronic Warfare - BEL",
      "0x56c8374619283746192837461928374619283746192837461928374619283746",
      USER_ROLE
    );
    await usrTx.wait();
    console.log(`✓ User identity & role assigned to ${user.address}`);
  }

  // Mint Initial Verifiable Defense Assets
  console.log("\n--- Minting Initial Defence Asset NFTs ---");
  const assetManager = manager || deployer;
  
  // Mint Asset 1: Radar Transceiver
  const mintTx1 = await assetNFT.connect(deployer).mintAsset(
    "BEL-TRX-900 Radar Transceiver Module",
    "TACTICAL_HARDWARE",
    "High-frequency phased array cryptographic radar transceiver with anti-jamming module.",
    "QmDX9a8f27cb4841961e6191c95b42cf431a49479b4a1f",
    "SECRET",
    assetManager.address
  );
  await mintTx1.wait();
  console.log(`✓ Minted Asset #1 (Radar Transceiver) to ${assetManager.address}`);

  // Mint Asset 2: Tactical C4I Keypair
  if (user) {
    const mintTx2 = await assetNFT.connect(deployer).mintAsset(
      "BEL Tactical C4I Secure Keypair v4.2",
      "CRYPTO_KEYPAIR",
      "Asymmetric elliptical curve keypair for battlefield situational awareness communication.",
      "QmDX1b7c39de5842062f7202d06c53df542b50580c5b2a",
      "TOP_SECRET",
      user.address
    );
    await mintTx2.wait();
    console.log(`✓ Minted Asset #2 (C4I Keypair) allocated to ${user.address}`);
  }

  // Record initial audit event
  await auditLogger.recordEvent(
    "SYSTEM",
    "SYSTEM_INITIALIZATION",
    deployer.address,
    "CORE_SECURITY_CONTRACTS",
    "DecentraX genesis deployment and initial identity configuration completed for BEL.",
    true
  );
  console.log(`✓ Recorded genesis event in DecentraXAuditLogger`);

  // ==========================================
  // EXPORT DEPLOYED ADDRESSES & ARTIFACTS
  // ==========================================
  const network = await hre.ethers.provider.getNetwork();
  const deploymentInfo = {
    network: {
      name: network.name,
      chainId: Number(network.chainId),
    },
    contracts: {
      DecentraXAccessControl: accessControlAddress,
      IdentityRegistry: identityRegistryAddress,
      AssetNFT: assetNFTAddress,
      DecentraXAuditLogger: auditLoggerAddress,
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const contractsDir = path.join(__dirname, "..");
  fs.writeFileSync(
    path.join(contractsDir, "deployed-addresses.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Sync to frontend/src/contracts
  const frontendContractsDir = path.join(__dirname, "..", "..", "frontend", "src", "contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(frontendContractsDir, "deployed-contracts.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Copy ABIs for frontend
  const artifactsDir = path.join(contractsDir, "artifacts", "contracts");
  const contractsList = [
    { name: "DecentraXAccessControl", file: "DecentraXAccessControl.sol/DecentraXAccessControl.json" },
    { name: "IdentityRegistry", file: "IdentityRegistry.sol/IdentityRegistry.json" },
    { name: "AssetNFT", file: "AssetNFT.sol/AssetNFT.json" },
    { name: "DecentraXAuditLogger", file: "DecentraXAuditLogger.sol/DecentraXAuditLogger.json" },
  ];

  const abis = {};
  for (const c of contractsList) {
    const artifactPath = path.join(artifactsDir, c.file);
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
      abis[c.name] = artifact.abi;
    }
  }

  fs.writeFileSync(
    path.join(frontendContractsDir, "contract-abis.json"),
    JSON.stringify(abis, null, 2)
  );

  console.log(`\n==================================================`);
  console.log(`✓ Deployment completed successfully!`);
  console.log(`✓ Artifacts synced to frontend/src/contracts/`);
  console.log(`==================================================\n`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
