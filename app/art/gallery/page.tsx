import type { Metadata } from "next";
import PaintingGalleryPage from "@/components/gallery/PaintingGalleryPage";
import { client, urlFor } from "@/sanity/client";
import { ART_PIECES_QUERY } from "@/sanity/queries";
import type { ArtPiece } from "@/sanity/types";

const galleryDescription =
  "Walk Michelle Liu’s paintings in a 3D gallery room.";

export const metadata: Metadata = {
  title: "Art | michelle liu",
  description: galleryDescription,
  openGraph: {
    title: "Art | michelle liu",
    description: galleryDescription,
    type: "website",
    url: "https://www.liumichelle.com/art/gallery",
  },
  twitter: {
    card: "summary_large_image",
    site: "@michelletliu",
    creator: "@michelletliu",
    title: "Art | michelle liu",
    description: galleryDescription,
  },
};

export default async function Page() {
  const pieces = await client.fetch<ArtPiece[]>(ART_PIECES_QUERY);
  const paintings = (pieces ?? [])
    .filter((piece) => piece.artType === "painting" && piece.image)
    .map((piece) => {
      const detail = [piece.medium, piece.size, piece.year]
        .filter(Boolean)
        .join(", ");
      return {
        id: piece._id,
        imageUrl: urlFor(piece.image).width(1600).quality(90).url(),
        aspectRatio: piece.image?.dimensions?.aspectRatio,
        title: piece.title,
        detail: detail || undefined,
        size: piece.size || undefined,
      };
    });

  return <PaintingGalleryPage pieces={paintings} />;
}
