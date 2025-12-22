import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Yield Nexus | RWA Yield Orchestration on Mantle",
  description:
    "AI-powered institutional infrastructure for compliant RWA issuance and autonomous yield optimization on Mantle Network",
  keywords: [
    "Mantle",
    "RWA",
    "DeFi",
    "Yield",
    "ERC-3643",
    "Institutional",
    "AI Agents",
  ],
  openGraph: {
    title: "Yield Nexus | RWA Yield Orchestration on Mantle",
    description:
      "AI-powered institutional infrastructure for compliant RWA issuance and autonomous yield optimization",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster position="bottom-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
