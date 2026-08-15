import type { Metadata } from "next";
import Providers from "@/components/layout/Providers";
import HomeScrollRestoreScript from "@/components/shared/HomeScrollRestoreScript";
import "@/index.css";
import "@/styles/globals.css";

const siteDescription =
  "Designing to spark moments of delight & human connection. In-house at Apple, Roblox, & NASA. Clients include Cognition, Luma, & Pika.";

const siteOgImage = {
  url: "https://www.liumichelle.com/og-image.jpg?v=6",
  width: 1200,
  height: 628,
  alt: "Michelle Liu",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.liumichelle.com"),
  title: "michelle liu",
  description: siteDescription,
  keywords:
    "Michelle Liu, Product Designer, UX Designer, UI Designer, Apple Designer, Roblox Designer, NASA Designer, Cognition, Luma, Pika, Design Portfolio",
  authors: [{ name: "Michelle Liu" }],
  openGraph: {
    title: "michelle liu",
    description: siteDescription,
    type: "website",
    url: "https://www.liumichelle.com",
    images: [siteOgImage],
  },
  twitter: {
    card: "summary_large_image",
    site: "@michelletliu",
    creator: "@michelletliu",
    title: "michelle liu",
    description: siteDescription,
    images: [siteOgImage.url],
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
        {/* Must stay blocking and ahead of the body to beat the first paint. */}
        <HomeScrollRestoreScript />
      </head>
      <body suppressHydrationWarning>
        <div hidden dangerouslySetInnerHTML={{ __html: devtoolsComment }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
