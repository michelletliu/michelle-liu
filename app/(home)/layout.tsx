"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import HomePageClient from "@/components/home/HomePageClient";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const segments = useSelectedLayoutSegments();
  const [section, slugOrPopup, mode, bookSlug] = segments;

  const isProjectRoute = section === "project";
  const isFilmPopupRoute = section === "film" && slugOrPopup === "popup";

  const slug = isFilmPopupRoute ? "film" : isProjectRoute ? slugOrPopup : undefined;

  return (
    <>
      <HomePageClient
        slug={slug}
        mode={isProjectRoute ? mode : undefined}
        bookSlug={isProjectRoute ? bookSlug : undefined}
      />
      {children}
    </>
  );
}
