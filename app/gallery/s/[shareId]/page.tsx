import type { Metadata } from "next";
import Link from "next/link";
import GalleryPage from "@/components/gallery/GalleryPage";
import {
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

  const title = meta?.name ? `${meta.name} · gallery` : "gallery";

  return {
    title,
    robots: { index: false, follow: false },
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
      initialImageById={initialImageById}
      initialInspirationTitles={initialInspirationTitles}
    />
  );
}

function SharedGalleryError({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-[#e4e4e4] px-6 text-center">
      <p className="text-base text-zinc-700">{message}</p>
      <Link
        href="/gallery"
        className="text-base text-zinc-500 underline-offset-4 hover:text-zinc-800 hover:underline"
      >
        Create your own at /gallery
      </Link>
      <Link
        href="/"
        className="text-sm text-zinc-400 underline-offset-4 hover:text-zinc-600 hover:underline"
      >
        Home
      </Link>
    </div>
  );
}
