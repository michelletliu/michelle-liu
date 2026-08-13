import type { Metadata } from "next";
import ArtPage from "@/components/art/ArtPage";

const artDescription =
  "Paintings, drawings, graphite, sketchbooks, and murals by Michelle Liu.";

export const metadata: Metadata = {
  title: "Art | michelle liu",
  description: artDescription,
  openGraph: {
    title: "Art | michelle liu",
    description: artDescription,
    type: "website",
    url: "https://www.liumichelle.com/art",
  },
  twitter: {
    card: "summary_large_image",
    site: "@michelletliu",
    creator: "@michelletliu",
    title: "Art | michelle liu",
    description: artDescription,
  },
};

export default function Page() {
  return <ArtPage />;
}
