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
  title: "Meridian | Institutional DeFi on Mantle",
  description:
    "ERC-3643 compliant infrastructure meets autonomous AI agents. Discover, optimize, and execute yield strategies with full regulatory compliance.",
  keywords: [
    "Mantle",
    "RWA",
    "DeFi",
    "Yield",
    "ERC-3643",
    "Institutional",
    "AI Agents",
    "Meridian",
    "Compliance",
  ],
  openGraph: {
    title: "Meridian | Institutional DeFi Without Compromise",
    description:
      "ERC-3643 compliant infrastructure meets autonomous AI agents. The future of institutional DeFi on Mantle.",
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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster position="bottom-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
