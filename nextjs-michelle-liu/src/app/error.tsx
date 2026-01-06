"use client";

import { useEffect } from "react";
import ErrorMessage from "@/components/ErrorMessage";

type ErrorPageProps = {
  error: Error;
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <ErrorMessage />
      <p className="sr-only" aria-live="polite">
        An error occurred. Please try refreshing the page.
      </p>
    </>
  );
}
