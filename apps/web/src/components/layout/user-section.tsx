"use client";

import { useAccount } from "wagmi";

export function UserSection() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-3 mt-3 bg-gradient-to-r from-mantle-teal/10 to-transparent rounded-xl border border-mantle-teal/20">
      <div className="size-9 rounded-full bg-gradient-to-br from-mantle-teal to-mantle-teal/60 flex items-center justify-center text-xs font-bold text-black shadow-lg shadow-mantle-teal/20">
        {address.slice(2, 4).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">Connected</p>
        <p className="text-[10px] text-mantle-teal truncate font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      </div>
      <div className="size-2 rounded-full bg-mantle-teal animate-pulse" />
    </div>
  );
}
