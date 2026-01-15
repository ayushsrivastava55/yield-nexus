// Deployed contract addresses on Mantle Sepolia
export const CONTRACTS = {
  mantleSepolia: {
    identityRegistry: (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS ||
      "0x9Cc3F9D6Eb74b6b86B6F612941eDC8d25050147F") as `0x${string}`,
    complianceModule: (process.env.NEXT_PUBLIC_COMPLIANCE_MODULE_ADDRESS ||
      "0x3a7f6A3F8Ef685Aa4f2CA6d83a9995A9f3968f80") as `0x${string}`,
    rwaToken: (process.env.NEXT_PUBLIC_RWA_TOKEN_ADDRESS ||
      "0xFcD83652EEAA56Ea270300C26D7Ac80d710b067D") as `0x${string}`,
    yieldAgent: (process.env.NEXT_PUBLIC_YIELD_AGENT_ADDRESS ||
      "0x5e06853cF65D52f2607CE967918a854c7d480A7f") as `0x${string}`,
    strategyRouter: (process.env.NEXT_PUBLIC_STRATEGY_ROUTER_ADDRESS ||
      "0x3eb0791a5d27167b44713A45De98492e82B4955A") as `0x${string}`,
    yieldVault: (process.env.NEXT_PUBLIC_YIELD_VAULT_ADDRESS ||
      "0xD7044e9D798B5d2F6d18464bd3b8cb21f489E4EA") as `0x${string}`,
  },
} as const;

export const PROTOCOL_ADAPTERS = {
  merchantMoe: (process.env.NEXT_PUBLIC_MERCHANT_MOE_ROUTER_ADDRESS || "") as `0x${string}`,
  lendle: (process.env.NEXT_PUBLIC_LENDLE_LENDING_POOL_ADDRESS || "") as `0x${string}`,
} as const;

// ABIs for contract interactions
export const IDENTITY_REGISTRY_ABI = [
  {
    inputs: [{ name: "_investor", type: "address" }],
    name: "isVerified",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_investor", type: "address" }],
    name: "identity",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_investor", type: "address" }],
    name: "investorCountry",
    outputs: [{ name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_investor", type: "address" }],
    name: "getKYCTier",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "_investor", type: "address" },
      { name: "_kycTier", type: "uint8" },
      { name: "_country", type: "string" },
    ],
    name: "registerIdentity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const RWA_TOKEN_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "supplyCap",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const YIELD_AGENT_ABI = [
  {
    inputs: [],
    name: "nextAgentId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "agents",
    outputs: [
      { name: "owner", type: "address" },
      { name: "name", type: "string" },
      { name: "minRebalanceInterval", type: "uint256" },
      { name: "maxSlippage", type: "uint256" },
      { name: "gasLimit", type: "uint256" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_agentId", type: "uint256" }],
    name: "getAgentStrategies",
    outputs: [
      {
        components: [
          { name: "protocol", type: "address" },
          { name: "inputToken", type: "address" },
          { name: "outputToken", type: "address" },
          { name: "targetAllocation", type: "uint256" },
          { name: "currentAllocation", type: "uint256" },
          { name: "active", type: "bool" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const COMPLIANCE_MODULE_ABI = [
  {
    inputs: [{ name: "", type: "uint16" }],
    name: "restrictedCountries",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "_from", type: "address" },
      { name: "_to", type: "address" },
      { name: "_amount", type: "uint256" },
    ],
    name: "canTransfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Strategy Router ABI
export const STRATEGY_ROUTER_ABI = [
  {
    inputs: [{ name: "protocolId", type: "uint8" }],
    name: "protocolAdapters",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "approvedTokens",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Yield Vault ABI (ERC-4626)
export const YIELD_VAULT_ABI = [
  {
    inputs: [],
    name: "asset",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalAssets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "assets", type: "uint256" }],
    name: "convertToShares",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "shares", type: "uint256" }],
    name: "convertToAssets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "strategyRouter",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// KYC Tier enum matching contract
export enum KYCTier {
  None = 0,
  Retail = 1,
  Accredited = 2,
  Institutional = 3,
}

export function getKYCTierName(tier: number): string {
  switch (tier) {
    case KYCTier.Retail:
      return "Retail";
    case KYCTier.Accredited:
      return "Accredited";
    case KYCTier.Institutional:
      return "Institutional";
    default:
      return "Not Verified";
  }
}
