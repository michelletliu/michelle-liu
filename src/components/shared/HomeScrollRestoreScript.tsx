"use client";

import { useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { HOME_SCROLL_RESTORE_SCRIPT } from "@/components/shared/homeScrollReturn";

/**
 * Injects the home-scroll restore IIFE into `<head>` during SSR, outside the
 * hydrated React tree. A `<script>` child in RootLayout trips React's client
 * "scripts inside components are never executed" overlay once hydration
 * regenerates the document.
 *
 * Must stay blocking and ahead of the body so the offset lands before first
 * paint — Next inserts this just before `</head>`.
 */
export default function HomeScrollRestoreScript() {
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return (
      <script dangerouslySetInnerHTML={{ __html: HOME_SCROLL_RESTORE_SCRIPT }} />
    );
  });

  return null;
}
