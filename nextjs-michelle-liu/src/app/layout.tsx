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
    default: "michelle liu",
    template: "%s | michelle liu",
  },
  description:
    "Product designer crafting useful products that spark moments of delight & human connection. Previously at Apple, Roblox, and NASA.",
  keywords: [
    "Michelle Liu",
    "Product Designer",
    "UX Designer",
    "UI Designer",
    "Design Portfolio",
    "Apple Designer",
    "Roblox Designer",
    "NASA Designer",
    "User Experience Design",
    "Interaction Design",
    "Digital Product Design",
    "San Francisco Designer",
    "Bay Area Product Designer",
  ],
  authors: [{ name: "Michelle Liu", url: siteUrl }],
  creator: "Michelle Liu",
  publisher: "Michelle Liu",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "michelle liu",
    title: "michelle liu – product designer",
    description:
      "Product designer crafting useful products that spark moments of delight & human connection. Previously at Apple, Roblox, and NASA.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "michelle liu – product designer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "michelle liu – product designer",
    description:
      "Product designer crafting useful products that spark moments of delight & human connection. Previously at Apple, Roblox, and NASA.",
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
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
  },
  category: "Design Portfolio",
};

// JSON-LD structured data for better SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Michelle Liu",
  url: siteUrl,
  jobTitle: "Product Designer",
  description:
    "Product designer crafting useful products that spark moments of delight & human connection.",
  worksFor: [
    {
      "@type": "Organization",
      name: "Apple",
    },
  ],
  alumniOf: [
    { "@type": "Organization", name: "Roblox" },
    { "@type": "Organization", name: "NASA" },
  ],
  knowsAbout: [
    "Product Design",
    "User Experience Design",
    "User Interface Design",
    "Interaction Design",
  ],
  sameAs: [
    // Add your social profiles here
    // "https://linkedin.com/in/yourprofile",
    // "https://twitter.com/yourhandle",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Footer />
      </body>
    </html>
  );
}
