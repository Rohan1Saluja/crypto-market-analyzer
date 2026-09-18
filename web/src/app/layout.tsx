import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Manrope, Space_Grotesk } from "next/font/google";

import { cn } from "@/lib/utils";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "CMA — Crypto Market Analyzer",
    template: "%s | CMA",
  },
  description: "A market-intelligence workspace for understanding crypto markets.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        manrope.variable,
        spaceGrotesk.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
