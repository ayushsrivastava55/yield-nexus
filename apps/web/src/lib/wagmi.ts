"use client";

import { http, createStorage, cookieStorage } from "wagmi";
import { mainnet } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

// Custom Mantle chain definitions
export const mantleMainnet = {
  id: 5000,
  name: "Mantle",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  },
  rpcUrls: {
    default: { http: ["https://rpc.mantle.xyz"] },
    public: { http: ["https://rpc.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantle Explorer", url: "https://explorer.mantle.xyz" },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11" as `0x${string}`,
      blockCreated: 304717,
    },
  },
} as const;

export const mantleSepolia = {
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
    public: { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "Mantle Sepolia Explorer",
      url: "https://sepolia.mantlescan.xyz",
    },
  },
  testnet: true,
} as const;

// WalletConnect projectId - Get yours at https://cloud.walletconnect.com/
// Using a placeholder for development - replace with your own for production
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo";

export const config = getDefaultConfig({
  appName: "Yield Nexus",
  projectId,
  chains: [mantleMainnet, mantleSepolia, mainnet],
  ssr: false,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [mantleMainnet.id]: http(),
    [mantleSepolia.id]: http(),
    [mainnet.id]: http(),
  },
});

// Contract addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  [mantleMainnet.id]: {
    RWAToken: "" as `0x${string}`,
    ComplianceRegistry: "" as `0x${string}`,
    IdentityRegistry: "" as `0x${string}`,
    YieldAgent: "" as `0x${string}`,
    YieldVault: "" as `0x${string}`,
    StrategyRouter: "" as `0x${string}`,
  },
  [mantleSepolia.id]: {
    RWAToken: "" as `0x${string}`,
    ComplianceRegistry: "" as `0x${string}`,
    IdentityRegistry: "" as `0x${string}`,
    YieldAgent: "" as `0x${string}`,
    YieldVault: "" as `0x${string}`,
    StrategyRouter: "" as `0x${string}`,
  },
} as const;

// Known protocol addresses on Mantle
export const PROTOCOL_ADDRESSES = {
  [mantleMainnet.id]: {
    // Merchant Moe
    MerchantMoeRouter: "0xeaEE7EE68874218c3558b40063c42B82D3E7232a" as `0x${string}`,
    MerchantMoeFactory: "0x5bEf015CA9424A7C07B68490616a4C1F094BEdEc" as `0x${string}`,
    // INIT Capital
    InitCore: "" as `0x${string}`,
    // mETH Protocol
    mETH: "0xcDA86A272531e8640cD7F1a92c01839911B90bb0" as `0x${string}`,
    cmETH: "0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA" as `0x${string}`,
    // Stablecoins
    USDT: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE" as `0x${string}`,
    USDC: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9" as `0x${string}`,
    // Wrapped tokens
    WMNT: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8" as `0x${string}`,
  },
} as const;
