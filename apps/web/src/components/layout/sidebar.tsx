"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GitBranch,
  Bot,
  ShieldCheck,
  Settings,
  HelpCircle,
  LogOut,
  Wallet,
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import dynamic from "next/dynamic";

const navigation = [
  { name: "Portfolio", href: "/dashboard", icon: LayoutDashboard },
  { name: "Strategies", href: "/yield", icon: GitBranch },
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "Compliance", href: "/compliance", icon: ShieldCheck },
  { name: "Audit Ledger", href: "/audit", icon: Wallet },
  { name: "Bridge", href: "/bridge", icon: GitBranch },
];

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Support", href: "#", icon: HelpCircle },
];

// Dynamic user section component - loaded only on client
const DynamicUserSection = dynamic(
  () => import("./user-section").then((mod) => mod.UserSection),
  { ssr: false }
);

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-background flex flex-col justify-between py-6">
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="px-6 flex items-center gap-3">
          <div className="relative">
            <div className="size-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <span className="text-black font-bold text-lg">M</span>
            </div>
            <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl blur opacity-30" />
          </div>
          <div>
            <h1 className="text-foreground text-lg font-bold leading-tight tracking-tight">Meridian</h1>
            <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Institutional DeFi</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-mantle-teal/15 text-mantle-teal border border-mantle-teal/30"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-mantle-teal")} />
                <span className="text-sm font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-mantle-teal animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="px-3 flex flex-col gap-1 border-t border-border/50 pt-6">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}

        {/* User Section */}
        <DynamicUserSection />
      </div>
    </aside>
  );
}

export function TopHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between border-b border-border/50 px-8 py-5 sticky top-0 bg-background/95 backdrop-blur-xl z-10">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-foreground text-xl font-bold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="h-8 w-px bg-border/50 ml-2"></div>
        <div className="flex items-center gap-2 bg-mantle-teal/10 px-3 py-1.5 rounded-full border border-mantle-teal/20">
          <div className="size-2 rounded-full bg-mantle-teal animate-pulse"></div>
          <span className="text-[10px] font-semibold text-mantle-teal uppercase tracking-wide">Mantle Sepolia</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {children}
        <ConnectButton />
      </div>
    </header>
  );
}

function SyncTime() {
  const [time, setTime] = React.useState<string>("");

  React.useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return <span className="text-[10px] text-muted-foreground font-medium">--:--:--</span>;

  return (
    <span className="text-[10px] text-muted-foreground font-medium">
      Last synced: {time} UTC
    </span>
  );
}

export function PageFooter() {
  return (
    <footer className="mt-auto px-8 py-3 border-t border-border/50 flex justify-between items-center bg-background/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-muted-foreground">schedule</span>
          <SyncTime />
        </div>
        <div className="h-3 w-px bg-border/50"></div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-mantle-teal">cloud_done</span>
          <span className="text-[10px] text-muted-foreground font-medium">Network Active</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-[10px] text-muted-foreground/70 font-medium">
          © 2025 Meridian
        </span>
        <div className="flex gap-3">
          <a className="text-[10px] text-muted-foreground hover:text-mantle-teal transition-colors" href="#">
            Docs
          </a>
          <a className="text-[10px] text-muted-foreground hover:text-mantle-teal transition-colors" href="#">
            API
          </a>
        </div>
      </div>
    </footer>
  );
}
