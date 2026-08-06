import type { Metadata } from "next";
import GalleryPage from "@/components/gallery/GalleryPage";

const galleryDescription =
  "An interactive art gallery to visualize your ideas — generate paintings inspired by The Met.";

const galleryOgImage = {
  url: "https://www.liumichelle.com/gallery-og.png?v=4",
  width: 1200,
  height: 630,
  alt: "Michelle Liu’s interactive Gallery — framed AI paintings in a 3D room",
};

export const metadata: Metadata = {
  title: "gallery",
  description: galleryDescription,
  openGraph: {
    title: "gallery · michelle liu",
    description: galleryDescription,
    type: "website",
    url: "https://www.liumichelle.com/gallery",
    images: [galleryOgImage],
  },
  twitter: {
    card: "summary_large_image",
    site: "@michelletliu",
    creator: "@michelletliu",
    title: "gallery · michelle liu",
    description: galleryDescription,
    images: [galleryOgImage.url],
  },
};

export default function Page() {
  return <GalleryPage />;
}
