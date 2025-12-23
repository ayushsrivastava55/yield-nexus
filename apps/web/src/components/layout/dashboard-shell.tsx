"use client";

import dynamic from "next/dynamic";

const Header = dynamic(() => import("@/components/layout/header").then(m => m.Header), { ssr: false });
const AIChat = dynamic(() => import("@/components/ai/ai-chat").then(m => m.AIChat), { ssr: false });

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <AIChat />
    </>
  );
}
