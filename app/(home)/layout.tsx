"use client";

import { useParams } from "next/navigation";
import HomePageClient from "@/components/HomePageClient";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const slug = params.slug as string | undefined;
  const mode = params.mode as string | undefined;
  const bookSlug = params.bookSlug as string | undefined;

  return (
    <>
      <HomePageClient slug={slug} mode={mode} bookSlug={bookSlug} />
      {children}
    </>
  );
}
