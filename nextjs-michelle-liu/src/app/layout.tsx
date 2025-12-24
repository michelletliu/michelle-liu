import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://michelleliu.design";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Michelle Liu | Product Designer",
    template: "%s | Michelle Liu",
  },
  description:
    "Product Designer crafting thoughtful digital experiences. Previously at Apple, Roblox, Adobe, and NASA.",
  keywords: [
    "Product Designer",
    "UX Designer",
    "UI Designer",
    "Michelle Liu",
    "Design Portfolio",
    "Apple Designer",
    "Roblox Designer",
  ],
  authors: [{ name: "Michelle Liu" }],
  creator: "Michelle Liu",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Michelle Liu",
    title: "Michelle Liu | Product Designer",
    description:
      "Product Designer crafting thoughtful digital experiences. Previously at Apple, Roblox, Adobe, and NASA.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Michelle Liu - Product Designer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Michelle Liu | Product Designer",
    description:
      "Product Designer crafting thoughtful digital experiences. Previously at Apple, Roblox, Adobe, and NASA.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Footer />
      </body>
    </html>
  );
}
