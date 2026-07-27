import type { Metadata } from "next";
import GalleryPage from "@/components/gallery/GalleryPage";

export const metadata: Metadata = {
  title: "gallery",
};

export default function Page() {
  return <GalleryPage />;
}
