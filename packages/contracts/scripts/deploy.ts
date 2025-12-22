import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy Identity Registry
  console.log("\n1. Deploying IdentityRegistry...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  const identityRegistryAddress = await identityRegistry.getAddress();
  console.log("IdentityRegistry deployed to:", identityRegistryAddress);

  // 2. Deploy Compliance Module
  console.log("\n2. Deploying ComplianceModule...");
  const ComplianceModule = await ethers.getContractFactory("ComplianceModule");
  const complianceModule = await ComplianceModule.deploy(identityRegistryAddress);
  await complianceModule.waitForDeployment();
  const complianceModuleAddress = await complianceModule.getAddress();
  console.log("ComplianceModule deployed to:", complianceModuleAddress);

  // 3. Deploy RWA Token
  console.log("\n3. Deploying RWAToken...");
  const RWAToken = await ethers.getContractFactory("RWAToken");
  const rwaToken = await RWAToken.deploy(
    "Yield Nexus RWA Token",
    "ynRWA",
    identityRegistryAddress,
    complianceModuleAddress,
    "BOND",
    "Tokenized corporate bond for institutional investors",
    ethers.parseEther("1000000") // 1M supply cap
  );
  await rwaToken.waitForDeployment();
  const rwaTokenAddress = await rwaToken.getAddress();
  console.log("RWAToken deployed to:", rwaTokenAddress);

  // 4. Deploy Yield Agent
  console.log("\n4. Deploying YieldAgent...");
  const YieldAgent = await ethers.getContractFactory("YieldAgent");
  const yieldAgent = await YieldAgent.deploy();
  await yieldAgent.waitForDeployment();
  const yieldAgentAddress = await yieldAgent.getAddress();
  console.log("YieldAgent deployed to:", yieldAgentAddress);

  // 5. Setup roles
  console.log("\n5. Setting up roles...");
  
  // Grant COMPLIANCE_AGENT_ROLE to RWAToken on ComplianceModule
  const COMPLIANCE_AGENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("COMPLIANCE_AGENT_ROLE"));
  await complianceModule.grantRole(COMPLIANCE_AGENT_ROLE, rwaTokenAddress);
  console.log("Granted COMPLIANCE_AGENT_ROLE to RWAToken");

  // 6. Set restricted countries (example: sanctioned jurisdictions)
  console.log("\n6. Setting up compliance rules...");
  // Country codes: 408 = North Korea, 364 = Iran, 760 = Syria
  await complianceModule.batchSetCountryRestrictions([408, 364, 760], true);
  console.log("Set restricted countries");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log("");
  console.log("Contract Addresses:");
  console.log(`  IdentityRegistry:  ${identityRegistryAddress}`);
  console.log(`  ComplianceModule:  ${complianceModuleAddress}`);
  console.log(`  RWAToken:          ${rwaTokenAddress}`);
  console.log(`  YieldAgent:        ${yieldAgentAddress}`);
  console.log("");
  console.log("Save these addresses to your frontend .env file!");
  console.log("=".repeat(60));

  // Return addresses for verification script
  return {
    identityRegistry: identityRegistryAddress,
    complianceModule: complianceModuleAddress,
    rwaToken: rwaTokenAddress,
    yieldAgent: yieldAgentAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
