import type { Metadata } from "next";
import FadingPage from "@/components/experiments/FadingPage";

export const metadata: Metadata = {
  title: "fading",
};

export default function Page() {
  return <FadingPage />;
}
