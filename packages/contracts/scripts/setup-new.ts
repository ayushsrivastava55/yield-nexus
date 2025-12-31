import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Running setup with account:", deployer.address);

  const ADDRESSES = {
    strategyRouter: "0x3eb0791a5d27167b44713A45De98492e82B4955A",
    yieldVault: "0xD7044e9D798B5d2F6d18464bd3b8cb21f489E4EA",
    yieldAgent: "0x5e06853cF65D52f2607CE967918a854c7d480A7f",
  };

  const MERCHANT_MOE_ROUTER = "0x013e1383ef15ab060e510bc3151d9a7bfb6f6722";
  const INIT_CORE = "0x972BcB0284cca0152527c4f70f8F689852bCAFc5";

  const TOKENS = {
    WMNT: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8",
    USDT: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE",
    USDC: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9",
    mETH: "0xcDA86A272531e8640cD7F1a92c01839911B90bb0",
    cmETH: "0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA",
  };

  const FEEDS = {
    MNT_USD: "0x4cb19663ebcfde8de474196d2e182659f006dc3b",
    USDT_USD: "0x700f0d9fbc1dbcf8d5892194ad8911f3fa157953",
    USDC_USD: "0xf3a9fb36d511febe5f6a0be0d200e1fa5a2c4555",
  };

  const strategyRouter = await ethers.getContractAt(
    "StrategyRouter",
    ADDRESSES.strategyRouter
  );
  const yieldVault = await ethers.getContractAt("YieldVault", ADDRESSES.yieldVault);
  const yieldAgent = await ethers.getContractAt("YieldAgent", ADDRESSES.yieldAgent);

  console.log("Setting StrategyRouter in YieldVault...");
  await (await yieldVault.setStrategyRouter(ADDRESSES.strategyRouter)).wait();

  console.log("Setting StrategyRouter in YieldAgent...");
  await (await yieldAgent.setStrategyRouter(ADDRESSES.strategyRouter)).wait();

  console.log("Setting protocol adapters...");
  await (await strategyRouter.setProtocolAdapter(1, MERCHANT_MOE_ROUTER)).wait();
  await (await strategyRouter.setProtocolAdapter(2, INIT_CORE)).wait();

  console.log("Approving tokens...");
  for (const [name, address] of Object.entries(TOKENS)) {
    await (await strategyRouter.setTokenApproval(address, true)).wait();
    console.log(`Approved token: ${name}`);
  }

  console.log("Setting oracle feeds...");
  await (await strategyRouter.setPriceFeed(TOKENS.WMNT, FEEDS.MNT_USD)).wait();
  await (await strategyRouter.setPriceFeed(TOKENS.USDT, FEEDS.USDT_USD)).wait();
  await (await strategyRouter.setPriceFeed(TOKENS.USDC, FEEDS.USDC_USD)).wait();
  console.log("Oracle feeds set");

  console.log("Granting EXECUTOR_ROLE to YieldAgent...");
  const EXECUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EXECUTOR_ROLE"));
  await (await strategyRouter.grantRole(EXECUTOR_ROLE, ADDRESSES.yieldAgent)).wait();

  console.log("Setup complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
