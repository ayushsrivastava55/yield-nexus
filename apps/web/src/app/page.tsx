import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  Bot,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Lock,
  Globe,
  Cpu,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white overflow-hidden">
      {/* Gradient Orbs Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/10 blur-[120px]" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-l from-blue-500/15 to-cyan-500/10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <span className="text-black font-bold text-lg">M</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl blur opacity-40" />
              </div>
              <span className="text-xl font-bold tracking-tight">Meridian</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/yield" className="text-sm text-white/60 hover:text-white transition-colors">
                Yields
              </Link>
              <Link href="/agents" className="text-sm text-white/60 hover:text-white transition-colors">
                Agents
              </Link>
              <Link href="/compliance" className="text-sm text-white/60 hover:text-white transition-colors">
                Compliance
              </Link>
              <a href="https://sepolia.mantlescan.xyz" target="_blank" rel="noopener noreferrer" className="text-sm text-white/60 hover:text-white transition-colors">
                Contracts
              </a>
            </div>

            <Link href="/dashboard">
              <Button className="bg-white text-black hover:bg-white/90 font-semibold px-6">
                Launch App
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm text-white/70">Live on Mantle Network</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Institutional DeFi
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Without Compromise
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
              ERC-3643 compliant infrastructure meets autonomous AI agents.
              Discover, optimize, and execute yield strategies across Mantle — with full regulatory compliance.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-semibold px-8 h-14 text-base">
                  Start Building
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/yield">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 h-14 text-base">
                  Explore Yields
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { value: "ERC-3643", label: "Compliance Standard" },
              { value: "24/7", label: "Autonomous Agents" },
              { value: "< 2s", label: "Execution Time" },
              { value: "$0", label: "Platform Fees" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem → Solution Section */}
      <section className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              The Institutional DeFi Problem
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              $100 trillion in traditional assets can't access DeFi yields. Here's why — and how Meridian fixes it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                problem: "Compliance Friction",
                solution: "ERC-3643 Identity",
                description: "On-chain KYC with jurisdiction rules, investment limits, and transfer restrictions enforced by smart contracts.",
                icon: Shield,
              },
              {
                problem: "Fragmented Yield",
                solution: "Unified Discovery",
                description: "Real-time aggregation across Merchant Moe, Lendle, INIT Capital, and every Mantle protocol in one dashboard.",
                icon: TrendingUp,
              },
              {
                problem: "Manual Management",
                solution: "AI Agents",
                description: "Autonomous portfolio optimization with Chainlink Automation. Set parameters, deploy, and let AI handle the rest.",
                icon: Bot,
              },
            ].map((item, i) => (
              <div key={i} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-colors h-full">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-6">
                    <item.icon className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div className="text-sm text-red-400/80 line-through mb-2">{item.problem}</div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.solution}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          {/* Feature 1: Compliance */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6">
                <Lock className="h-4 w-4" />
                Compliance Layer
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold mb-6">
                Institutional-Grade
                <br />
                <span className="text-white/50">Identity & Compliance</span>
              </h3>
              <p className="text-white/50 mb-8 leading-relaxed">
                Deploy ERC-3643 compliant tokens in minutes. Our identity registry supports multiple verification methods including zkPassport and zkMe biometrics.
              </p>
              <ul className="space-y-4">
                {[
                  "Multi-jurisdiction KYC/AML automation",
                  "Tiered access: Retail, Accredited, Institutional",
                  "On-chain transfer restrictions",
                  "Full audit trail on Mantle",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/70">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-[#111113] rounded-3xl border border-white/10 p-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">KYC Status</div>
                        <div className="text-xs text-white/40">Identity Verified</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                      Accredited
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Jurisdiction</div>
                        <div className="text-xs text-white/40">United States</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                      Approved
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Investment Limit</div>
                        <div className="text-xs text-white/40">Based on tier</div>
                      </div>
                    </div>
                    <div className="text-sm font-mono text-white/70">$1,000,000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: AI Agents */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-[#111113] rounded-3xl border border-white/10 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Cpu className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Yield Optimizer v2</div>
                    <div className="text-xs text-emerald-400">Active • Running</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-xs text-white/40 mb-1">Max Slippage</div>
                    <div className="text-lg font-semibold">0.5%</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-xs text-white/40 mb-1">Rebalance</div>
                    <div className="text-lg font-semibold">4 hours</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-xs text-white/40 mb-1">Gas Limit</div>
                    <div className="text-lg font-semibold">50 gwei</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-xs text-white/40 mb-1">Drift Threshold</div>
                    <div className="text-lg font-semibold">5%</div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-emerald-400">Next rebalance check</div>
                    <div className="text-sm font-mono text-white">2h 34m</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-6">
                <Bot className="h-4 w-4" />
                AI Agents
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold mb-6">
                Autonomous Yield
                <br />
                <span className="text-white/50">Optimization</span>
              </h3>
              <p className="text-white/50 mb-8 leading-relaxed">
                Deploy AI agents that monitor, analyze, and rebalance your portfolio 24/7. Powered by Chainlink Automation for trustless execution.
              </p>
              <ul className="space-y-4">
                {[
                  "Chainlink Automation for scheduled execution",
                  "Drift-based and time-based rebalancing",
                  "Multi-strategy portfolio management",
                  "Real execution via Strategy Router",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/70">
                    <CheckCircle2 className="h-5 w-5 text-cyan-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Protocols Section */}
      <section className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Integrated Protocols
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Real integrations with live protocols on Mantle. Not mocks — actual on-chain execution.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Merchant Moe", type: "DEX", status: "Live", color: "emerald" },
              { name: "Lendle", type: "Lending", status: "Live", color: "blue" },
              { name: "INIT Capital", type: "Money Market", status: "Soon", color: "purple" },
              { name: "mETH Protocol", type: "LST", status: "Soon", color: "orange" },
            ].map((protocol, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-${protocol.color}-500/20 flex items-center justify-center`}>
                    <span className={`text-${protocol.color}-400 font-bold`}>{protocol.name[0]}</span>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${protocol.status === 'Live' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'}`}>
                    {protocol.status}
                  </div>
                </div>
                <div className="font-semibold mb-1">{protocol.name}</div>
                <div className="text-sm text-white/40">{protocol.type}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-white/70">Mantle Global Hackathon 2025</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Build?
          </h2>

          <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto">
            Deploy compliant RWA infrastructure in minutes. Let AI agents optimize your yield 24/7.
            The future of institutional DeFi starts here.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 font-semibold px-8 h-14 text-base">
                Launch Application
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 h-14 text-base">
                View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <span className="text-black font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold">Meridian</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-white/40">
              <a href="https://sepolia.mantlescan.xyz/address/0x5e06853cF65D52f2607CE967918a854c7d480A7f" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Contracts
              </a>
              <a href="https://mantle.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Mantle Network
              </a>
              <span>Built for Mantle Hackathon 2025</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
