import type { Metadata } from "next";
import Link from "next/link";
import imgLogo from "@/assets/logo.png";
import GalleryPage from "@/components/gallery/GalleryPage";
import {
  formatGalleryAttribution,
  isGalleryPaintingId,
  isValidShareId,
} from "@/components/gallery/sharedGallery";
import { getShareMeta } from "@/lib/gallery/shareBlob";

/** Always read latest meta — update-existing must show regenerated hangs. */
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ shareId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { shareId } = await params;
  const meta =
    process.env.BLOB_READ_WRITE_TOKEN && isValidShareId(shareId)
      ? await getShareMeta(shareId)
      : null;

  const title = meta?.name
    ? `${formatGalleryAttribution(meta.name, meta.creator)} · gallery`
    : "gallery";

  const description = meta?.name
    ? `${formatGalleryAttribution(meta.name, meta.creator)} — a shared gallery on michelle liu.`
    : "An interactive art gallery to visualize your ideas.";

  const ogImage = {
    url: "https://www.liumichelle.com/gallery-og.png?v=4",
    width: 1200,
    height: 630,
    alt: title,
  };

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://www.liumichelle.com/gallery/s/${shareId}`,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      site: "@michelletliu",
      creator: "@michelletliu",
      title,
      description,
      images: [ogImage.url],
    },
  };
}

export default async function SharedGalleryPage({ params }: PageProps) {
  const { shareId } = await params;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return <SharedGalleryError message="This gallery link is unavailable." />;
  }

  if (!isValidShareId(shareId)) {
    return <SharedGalleryError message="Gallery not found." />;
  }

  const meta = await getShareMeta(shareId);
  if (!meta) {
    return <SharedGalleryError message="Gallery not found." />;
  }

  const initialImageById: Record<string, string> = {};
  const initialInspirationTitles: Record<string, string> = {};
  for (const hang of meta.hangs) {
    if (!isGalleryPaintingId(hang.paintingId)) continue;
    initialImageById[hang.paintingId] = hang.imageUrl;
    if (hang.inspirationTitle) {
      initialInspirationTitles[hang.paintingId] = hang.inspirationTitle;
    }
  }

  return (
    <GalleryPage
      mode="view"
      galleryName={meta.name}
      galleryCreator={meta.creator}
      initialImageById={initialImageById}
      initialInspirationTitles={initialInspirationTitles}
    />
  );
}

function SharedGalleryError({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-100 px-6 text-center">
      <a
        href="/"
        aria-label="Go back to home"
        className="transition-opacity duration-200 hover:opacity-80"
      >
        <img
          src={imgLogo}
          alt="Michelle Liu Logo"
          className="size-8 object-contain md:size-[44px]"
          loading="eager"
          decoding="async"
        />
      </a>
      <p className="text-base text-zinc-500">{message}</p>
      <Link
        href="/gallery"
        className="text-base text-zinc-700 transition-colors duration-200 hover:text-blue-500"
      >
        www.liumichelle.com/gallery
      </Link>
    </div>
  );
}
