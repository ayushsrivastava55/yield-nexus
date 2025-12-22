import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  ShieldCheck,
  Bot,
  TrendingUp,
  Layers,
  Zap,
  Lock,
  BarChart3,
} from "lucide-react";

const features = [
  {
    name: "ERC-3643 Compliance",
    description:
      "Full permissioned token framework with KYC/AML automation, identity registry, and multi-jurisdiction support.",
    icon: ShieldCheck,
  },
  {
    name: "AI Yield Agents",
    description:
      "Autonomous portfolio optimization across Mantle DeFi. Discover, rank, and execute yield strategies automatically.",
    icon: Bot,
  },
  {
    name: "Yield Discovery",
    description:
      "Real-time monitoring across Merchant Moe, INIT Capital, mETH Protocol, and native RWA vaults.",
    icon: TrendingUp,
  },
  {
    name: "Institutional Grade",
    description:
      "Built for institutions with audit trails, multi-sig support, and regulatory compliance baked in.",
    icon: Layers,
  },
];

const stats = [
  { value: "$25B+", label: "RWA Market 2025" },
  { value: "ERC-3643", label: "Compliance Standard" },
  { value: "5000", label: "Mantle Chain ID" },
  { value: "24/7", label: "Autonomous Agents" },
];

const protocols = [
  { name: "Merchant Moe", type: "DEX" },
  { name: "INIT Capital", type: "Money Market" },
  { name: "mETH Protocol", type: "Liquid Staking" },
  { name: "Renzo", type: "Restaking" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
                Built for Mantle Global Hackathon 2025
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              RWA Yield Orchestration
              <span className="block text-primary">Powered by AI</span>
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Institutional-grade infrastructure combining ERC-3643 compliant RWA tokens 
              with autonomous AI agents for optimal yield discovery and execution on Mantle Network.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-4">
              <Link href="/dashboard">
                <Button size="xl" variant="gradient">
                  Launch App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/compliance">
                <Button size="xl" variant="outline">
                  Issue RWA Token
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Complete RWA Infrastructure
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to tokenize, manage, and optimize real-world assets on Mantle.
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.name} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{feature.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Protocols Section */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold">Integrated Protocols</h2>
            <p className="mt-2 text-muted-foreground">
              AI agents automatically optimize yield across Mantle ecosystem
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {protocols.map((protocol) => (
              <div
                key={protocol.name}
                className="flex items-center gap-2 rounded-full bg-background px-4 py-2 border"
              >
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium">{protocol.name}</span>
                <span className="text-xs text-muted-foreground">({protocol.type})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-3xl bg-primary/5 px-6 py-16 text-center sm:px-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Tokenize Real-World Assets?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Deploy compliant RWA tokens in minutes, not months. Let AI agents handle yield optimization.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-4">
              <Link href="/compliance">
                <Button size="lg" variant="gradient">
                  <Lock className="mr-2 h-4 w-4" />
                  Start KYC Process
                </Button>
              </Link>
              <Link href="/yield">
                <Button size="lg" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Explore Yields
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-mantle flex items-center justify-center">
                <span className="text-white font-bold text-sm">YN</span>
              </div>
              <span className="font-semibold">Yield Nexus</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for Mantle Global Hackathon 2025 • ERC-3643 Compliant
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
