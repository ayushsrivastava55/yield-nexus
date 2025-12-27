// Deployed contract addresses on Mantle Sepolia
export const CONTRACTS = {
  mantleSepolia: {
    identityRegistry: "0x9Cc3F9D6Eb74b6b86B6F612941eDC8d25050147F" as `0x${string}`,
    complianceModule: "0x3a7f6A3F8Ef685Aa4f2CA6d83a9995A9f3968f80" as `0x${string}`,
    rwaToken: "0xFcD83652EEAA56Ea270300C26D7Ac80d710b067D" as `0x${string}`,
    yieldAgent: "0xD7E8c4E890933dff614c01cb5085fAf33B2A7F19" as `0x${string}`,
    strategyRouter: "0x20e0F970eCFBaEF15002742370b7B53FD66055f0" as `0x${string}`,
    yieldVault: "0x4150Ac138470d2bA433480A2Fea34f6035e4b770" as `0x${string}`,
  },
} as const;

// ABIs for contract interactions
export const IDENTITY_REGISTRY_ABI = [
  {
    inputs: [{ name: "investor", type: "address" }],
    name: "isVerified",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "investor", type: "address" }],
    name: "getIdentity",
    outputs: [
      { name: "country", type: "uint16" },
      { name: "kycTier", type: "uint8" },
      { name: "registrationDate", type: "uint256" },
      { name: "expirationDate", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "investor", type: "address" }],
    name: "getKYCTier",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
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
    name: "agentCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "agentId", type: "uint256" }],
    name: "getAgent",
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
    inputs: [{ name: "owner", type: "address" }],
    name: "getUserAgentCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "index", type: "uint256" }],
    name: "getUserAgentId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const COMPLIANCE_MODULE_ABI = [
  {
    inputs: [{ name: "countryCode", type: "uint16" }],
    name: "isCountryRestricted",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
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
