import type { Metadata } from "next";
import FadingPage from "@/components/FadingPage";

export const metadata: Metadata = {
  title: "fading",
};

export default function Page() {
  return <FadingPage />;
}
