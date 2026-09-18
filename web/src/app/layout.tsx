import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Manrope, Space_Grotesk } from "next/font/google";

import { WatchlistProvider } from "@/components/watchlist/watchlist-provider";
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

const title = "Calyrn | Signal, in context.";
const description =
  "Personal crypto intelligence for market research, exposure, risk, and the signals that matter to you.";
const socialImageAlt =
  "Calyrn — Signal, in context. Personal crypto intelligence for research, exposure, and risk.";

export const viewport: Viewport = {
  themeColor: "#0b100e",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Calyrn",
  },
  description,
  applicationName: "Calyrn",
  category: "finance",
  keywords: [
    "crypto intelligence",
    "crypto research",
    "portfolio risk",
    "market intelligence",
    "digital assets",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/previews/calyrn-apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Calyrn",
    title: "Calyrn — Signal, in context.",
    description,
    images: [
      {
        url: "/previews/calyrn-opengraph.png",
        width: 1200,
        height: 630,
        alt: socialImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Calyrn — Signal, in context.",
    description,
    images: [
      {
        url: "/previews/calyrn-twitter.png",
        alt: socialImageAlt,
      },
    ],
  },
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
        <WatchlistProvider>{children}</WatchlistProvider>
      </body>
    </html>
  );
}
