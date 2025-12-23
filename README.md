# Yield Nexus - RWA Yield Orchestration Layer

> AI-powered institutional infrastructure for compliant RWA issuance and autonomous yield optimization on Mantle Network

[![Mantle](https://img.shields.io/badge/Built%20on-Mantle-blue)](https://mantle.xyz)
[![ERC-3643](https://img.shields.io/badge/Standard-ERC--3643-green)](https://erc3643.org)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 🎯 Overview

**Yield Nexus** solves three critical bottlenecks in institutional RWA adoption:

1. **Compliance Friction** - Multi-jurisdictional KYC/AML with ERC-3643 permissioned tokens
2. **Fragmented Yield** - Unified discovery across Mantle DeFi (Merchant Moe, INIT, mETH)
3. **Manual Management** - Autonomous AI agents for yield optimization

## 🏗️ Architecture

```
yield-nexus/
├── apps/
│   └── web/                 # Next.js 15 frontend
│       ├── src/app/         # App Router pages
│       ├── src/components/  # React components
│       └── src/lib/         # Utilities & config
├── packages/
│   └── contracts/           # Solidity smart contracts
│       ├── compliance/      # ERC-3643 implementation
│       ├── token/           # RWA Token
│       └── agents/          # Yield Agent
└── apps/backend/            # Python FastAPI + LangChain (coming soon)
```

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.1.0
- [Node.js](https://nodejs.org/) >= 18.0.0
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/yield-nexus.git
cd yield-nexus

# Install dependencies
bun install

# Copy environment files
cp apps/web/.env.example apps/web/.env.local
cp packages/contracts/.env.example packages/contracts/.env
```

### Environment Setup

**Frontend (`apps/web/.env.local`):**

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Contracts (`packages/contracts/.env`):**

```env
PRIVATE_KEY=your_private_key_without_0x
MANTLESCAN_API_KEY=your_api_key
```

### Development

```bash
# Start Next.js frontend
bun run web:dev

# Compile smart contracts
bun run contracts:compile

# Run contract tests
bun run contracts:test

# Deploy to Mantle Sepolia testnet
bun run contracts:deploy
```

## 📋 Smart Contracts

### Core Contracts

| Contract           | Description                                   | Standard             |
| ------------------ | --------------------------------------------- | -------------------- |
| `RWAToken`         | Permissioned RWA token with compliance checks | ERC-3643             |
| `IdentityRegistry` | KYC/AML identity management                   | ERC-3643             |
| `ComplianceModule` | Transfer restriction rules                    | ERC-3643             |
| `YieldAgent`       | Autonomous yield optimization                 | Chainlink Automation |

### Deployment (Mantle Sepolia)

```bash
cd packages/contracts
bun install
cp .env.example .env
# Edit .env with your private key
bun run deploy
```

## 🌐 Network Configuration

| Network        | Chain ID | RPC URL                        |
| -------------- | -------- | ------------------------------ |
| Mantle Mainnet | 5000     | https://rpc.mantle.xyz         |
| Mantle Sepolia | 5003     | https://rpc.sepolia.mantle.xyz |

**Faucet:** https://faucet.sepolia.mantle.xyz/

## 🎨 Tech Stack

### Frontend

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Web3:** Wagmi v2 + Viem + RainbowKit
- **State:** Zustand + TanStack Query

### Smart Contracts

- **Language:** Solidity 0.8.24
- **Framework:** Hardhat
- **Standards:** ERC-3643, ERC-20, ERC-4626
- **Automation:** Chainlink Automation

### AI Backend (Implemented)

- **Framework:** Next.js API Routes (Edge Runtime)
- **AI SDK:** Vercel AI SDK + OpenAI
- **LLM:** GPT-4o
- **Endpoints:** `/api/ai/chat`, `/api/ai/analyze`, `/api/ai/strategy`, `/api/ai/yields`

## 📊 Features

### ✅ Implemented (MVP)

- [x] ERC-3643 compliant RWA token
- [x] Identity Registry with KYC tiers
- [x] Compliance Module with jurisdiction rules
- [x] Yield Agent with Chainlink Automation
- [x] Next.js dashboard UI
- [x] Wallet connection (RainbowKit)
- [x] Mantle network integration
- [x] AI yield discovery agent (OpenAI GPT-4o)
- [x] Yield discovery page with filters
- [x] Agent management dashboard
- [x] Compliance/KYC status page
- [x] Streaming AI chat API

### 🔄 In Progress

- [ ] Real protocol integrations (Merchant Moe, INIT Capital)
- [ ] On-chain agent deployment
- [ ] Live yield data feeds

### 📅 Planned

- [ ] Multi-sig support
- [ ] Audit trail on Mantle DA
- [ ] Cross-chain bridge
- [ ] Backtest engine

## 🔐 Security

- ERC-3643 compliance for permissioned transfers
- Role-based access control (OpenZeppelin)
- Pausable contracts for emergencies
- Token recovery mechanism for lost wallets
- Multi-jurisdiction compliance rules

## 📚 Documentation

- [ERC-3643 Standard](https://docs.erc3643.org/)
- [Mantle Network Docs](https://docs.mantle.xyz/)
- [Chainlink Automation](https://docs.chain.link/chainlink-automation)

## 🏆 Hackathon Tracks

- **RWA/RealFi** (Primary) - ERC-3643 compliance framework
- **AI & Oracles** - Autonomous yield agents
- **Infrastructure & Tooling** - Institutional dashboard
- **Best UX/Demo** - Clean institutional UX

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

---

**Built for Mantle Global Hackathon 2025** 🚀
