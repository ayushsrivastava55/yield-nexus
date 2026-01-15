"use client";

import dynamic from "next/dynamic";
import { Sidebar, PageFooter } from "@/components/layout/sidebar";

const AIChat = dynamic(() => import("@/components/ai/ai-chat").then(m => m.AIChat), { ssr: false });

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        {children}
        <PageFooter />
      </main>
      <AIChat />
    </div>
  );
}
