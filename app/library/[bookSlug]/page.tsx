import { Suspense } from "react";
import LibraryPage from "@/components/library/LibraryPage";

export default async function Page({
  params,
}: {
  params: Promise<{ bookSlug: string }>;
}) {
  const { bookSlug } = await params;
  return (
    <Suspense fallback={null}>
      <LibraryPage bookSlug={bookSlug} />
    </Suspense>
  );
}
