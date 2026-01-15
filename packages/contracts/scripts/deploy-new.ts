import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying NEW contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Existing contract addresses (from previous deployment)
  const EXISTING_CONTRACTS = {
    identityRegistry: "0x9Cc3F9D6Eb74b6b86B6F612941eDC8d25050147F",
    complianceModule: "0x3a7f6A3F8Ef685Aa4f2CA6d83a9995A9f3968f80",
    rwaToken: "0xFcD83652EEAA56Ea270300C26D7Ac80d710b067D",
  };

  // 1. Deploy Strategy Router
  console.log("\n1. Deploying StrategyRouter...");
  const StrategyRouter = await ethers.getContractFactory("StrategyRouter");
  const strategyRouter = await StrategyRouter.deploy();
  await strategyRouter.waitForDeployment();
  const strategyRouterAddress = await strategyRouter.getAddress();
  console.log("StrategyRouter deployed to:", strategyRouterAddress);

  // 2. Deploy Yield Vault (using RWA Token as underlying asset)
  console.log("\n2. Deploying YieldVault...");
  const YieldVault = await ethers.getContractFactory("YieldVault");
  const yieldVault = await YieldVault.deploy(
    EXISTING_CONTRACTS.rwaToken,  // underlying asset
    "Yield Nexus Vault Shares",   // name
    "ynVAULT",                    // symbol
    deployer.address              // fee recipient
  );
  await yieldVault.waitForDeployment();
  const yieldVaultAddress = await yieldVault.getAddress();
  console.log("YieldVault deployed to:", yieldVaultAddress);

  // 3. Deploy a new YieldAgent for router execution
  console.log("\n3. Deploying YieldAgent...");
  const YieldAgentFactory = await ethers.getContractFactory("YieldAgent");
  const yieldAgent = await YieldAgentFactory.deploy();
  await yieldAgent.waitForDeployment();
  const yieldAgentAddress = await yieldAgent.getAddress();
  console.log("YieldAgent deployed to:", yieldAgentAddress);

  // 4. Setup roles and connections
  console.log("\n4. Setting up roles and connections...");
  
  // Set strategy router in vault
  await yieldVault.setStrategyRouter(strategyRouterAddress);
  console.log("Set StrategyRouter in YieldVault");

  // Set strategy router in YieldAgent for real execution path
  await yieldAgent.setStrategyRouter(strategyRouterAddress);
  console.log("Set StrategyRouter in YieldAgent");

  // Approve protocols in StrategyRouter
  // Protocol IDs: 1=Merchant Moe, 5=Lendle
  const MERCHANT_MOE_ROUTER = process.env.MERCHANT_MOE_ROUTER;
  const LENDLE_LENDING_POOL = process.env.LENDLE_LENDING_POOL;

  if (!MERCHANT_MOE_ROUTER || !LENDLE_LENDING_POOL) {
    console.warn("Missing MERCHANT_MOE_ROUTER or LENDLE_LENDING_POOL env vars. Skipping protocol setup.");
  } else {
    await strategyRouter.setProtocolAdapter(1, MERCHANT_MOE_ROUTER);
    console.log("Set Merchant Moe adapter");

    await strategyRouter.setProtocolAdapter(5, LENDLE_LENDING_POOL);
    console.log("Set Lendle adapter");
  }

  // Grant executor role to YieldAgent so it can run strategies
  const EXECUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EXECUTOR_ROLE"));
  await strategyRouter.grantRole(EXECUTOR_ROLE, yieldAgentAddress);
  console.log("Granted EXECUTOR_ROLE to YieldAgent");

  // Approve common tokens
  const TOKENS = process.env.APPROVED_TOKENS?.split(",").map((t) => t.trim()).filter(Boolean) || [];

  if (TOKENS.length === 0) {
    console.warn("No APPROVED_TOKENS provided. Skipping token approvals.");
  } else {
    for (const address of TOKENS) {
      await strategyRouter.setTokenApproval(address, true);
      console.log(`Approved token: ${address}`);
    }
  }

  // Also approve RWA token
  await strategyRouter.setTokenApproval(EXISTING_CONTRACTS.rwaToken, true);
  console.log("Approved RWA token");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("NEW DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log("");
  console.log("NEW Contract Addresses:");
  console.log(`  StrategyRouter:    ${strategyRouterAddress}`);
  console.log(`  YieldVault:        ${yieldVaultAddress}`);
  console.log(`  YieldAgent:        ${yieldAgentAddress}`);
  console.log("");
  console.log("EXISTING Contract Addresses:");
  console.log(`  IdentityRegistry:  ${EXISTING_CONTRACTS.identityRegistry}`);
  console.log(`  ComplianceModule:  ${EXISTING_CONTRACTS.complianceModule}`);
  console.log(`  RWAToken:          ${EXISTING_CONTRACTS.rwaToken}`);
  console.log("");
  console.log("Update your frontend config with these addresses!");
  console.log("=".repeat(60));

  return {
    strategyRouter: strategyRouterAddress,
    yieldVault: yieldVaultAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
