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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cma-rs.vercel.app";

const title = "CMA | Crypto Market Analyzer";
const description =
  "Research-first crypto market intelligence for prices, momentum, liquidity, market context, and deeper asset analysis.";

const socialImageAlt =
  "CMA | Read the market, not the noise. Research-first crypto market intelligence.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | CMA",
  },
  description,
  applicationName: title,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: title,
    title: "CMA — Read the market, not the noise.",
    description,
    images: [
      {
        url: "/previews/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: socialImageAlt,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "CMA — Read the market, not the noise.",
    description,
    images: [
      {
        url: "/previews/twitter-image.png",
        alt: socialImageAlt,
      },
    ],
  },

  category: "finance",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
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
