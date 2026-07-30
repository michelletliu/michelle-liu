import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "@/index.css";
import "@/styles/globals.css";

const siteDescription =
  "Designing products to spark moments of delight & human connection. Previously at Apple, Roblox, & NASA.";

export const metadata: Metadata = {
  title: "michelle liu",
  description: siteDescription,
  keywords:
    "Michelle Liu, Product Designer, UX Designer, UI Designer, Apple Designer, Roblox Designer, NASA Designer, Design Portfolio",
  authors: [{ name: "Michelle Liu" }],
  openGraph: {
    title: "michelle liu",
    description: siteDescription,
    type: "website",
    url: "https://www.liumichelle.com",
    images: [
      {
        url: "https://www.liumichelle.com/og-image.png?v=5",
        width: 1200,
        height: 628,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@michelletliu",
    creator: "@michelletliu",
    title: "michelle liu",
    description: siteDescription,
    images: ["https://www.liumichelle.com/og-image.png?v=5"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

const devtoolsComment = String.raw`<!--
                   ▄▄          ▄▄ ▄▄         ▄▄
         ▀▀        ██          ██ ██         ██ ▀▀
███▄███▄ ██  ▄████ ████▄ ▄█▀█▄ ██ ██ ▄█▀█▄   ██ ██  ██ ██
██ ██ ██ ██  ██    ██ ██ ██▄█▀ ██ ██ ██▄█▀   ██ ██  ██ ██
██ ██ ██ ██▄ ▀████ ██ ██ ▀█▄▄▄ ██ ██ ▀█▄▄▄   ██ ██▄ ▀██▀█

  hi, curious stranger :)
-->`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="/logo.png" fetchPriority="high" />
      </head>
      <body suppressHydrationWarning>
        <div hidden dangerouslySetInnerHTML={{ __html: devtoolsComment }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
