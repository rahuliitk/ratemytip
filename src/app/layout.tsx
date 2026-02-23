import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RateMyTip — Every Call. Rated.",
    template: "%s | RateMyTip",
  },
  description:
    "RateMyTip tracks, verifies, and scores stock market tips from influencers, brokerages, and analysts. See who actually delivers results with our transparent RMT Score.",
  keywords: [
    "stock tips",
    "crypto tips",
    "financial influencer",
    "tip accuracy",
    "RateMyTip",
    "stock tip tracker",
    "leaderboard",
    "trading performance",
  ],
  openGraph: {
    title: "RateMyTip — Every Call. Rated.",
    description:
      "Track, verify, and score stock market tips from influencers and analysts.",
    url: "https://ratemytip.com",
    siteName: "RateMyTip",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RateMyTip — Every Call. Rated.",
    description:
      "Track, verify, and score stock market tips from influencers and analysts.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
