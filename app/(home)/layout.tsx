"use client";

import { useParams, usePathname } from "next/navigation";
import HomePageClient from "@/components/home/HomePageClient";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();

  // /film/popup is a special route that opens the film popup on the homepage
  const isFilmPopup = pathname === "/film/popup";

  const slug = isFilmPopup ? "film" : (params.slug as string | undefined);
  const mode = params.mode as string | undefined;
  const bookSlug = params.bookSlug as string | undefined;

  return (
    <>
      <HomePageClient slug={slug} mode={mode} bookSlug={bookSlug} />
      {children}
    </>
  );
}
