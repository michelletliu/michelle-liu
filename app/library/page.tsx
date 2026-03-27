import { Suspense } from "react";
import LibraryPage from "@/components/library/LibraryPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LibraryPage />
    </Suspense>
  );
}
