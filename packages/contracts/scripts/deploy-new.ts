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
    yieldAgent: "0xD7E8c4E890933dff614c01cb5085fAf33B2A7F19",
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

  // 3. Setup roles and connections
  console.log("\n3. Setting up roles and connections...");
  
  // Set strategy router in vault
  await yieldVault.setStrategyRouter(strategyRouterAddress);
  console.log("Set StrategyRouter in YieldVault");

  // Approve protocols in StrategyRouter
  // Protocol IDs: 1=Merchant Moe, 2=INIT Capital, 3=Renzo, 4=mETH
  const MERCHANT_MOE_ROUTER = "0xeaEE7EE68874218c3558b40063c42B82D3E7232a";
  const INIT_CORE = "0x972BcB0284cca0152527c4f70f8F689852bCAFc5";
  
  await strategyRouter.setProtocolAdapter(1, MERCHANT_MOE_ROUTER);
  console.log("Set Merchant Moe adapter");
  
  await strategyRouter.setProtocolAdapter(2, INIT_CORE);
  console.log("Set INIT Capital adapter");

  // Approve common tokens
  const TOKENS = {
    WMNT: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8",
    USDT: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE",
    USDC: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9",
    mETH: "0xcDA86A272531e8640cD7F1a92c01839911B90bb0",
    cmETH: "0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA",
  };

  for (const [name, address] of Object.entries(TOKENS)) {
    await strategyRouter.setTokenApproval(address, true);
    console.log(`Approved token: ${name}`);
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
  console.log("");
  console.log("EXISTING Contract Addresses:");
  console.log(`  IdentityRegistry:  ${EXISTING_CONTRACTS.identityRegistry}`);
  console.log(`  ComplianceModule:  ${EXISTING_CONTRACTS.complianceModule}`);
  console.log(`  RWAToken:          ${EXISTING_CONTRACTS.rwaToken}`);
  console.log(`  YieldAgent:        ${EXISTING_CONTRACTS.yieldAgent}`);
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
