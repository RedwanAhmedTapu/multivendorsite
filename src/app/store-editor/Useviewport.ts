"use client";
import { useEffect, useState } from "react";

/** Matches the editor's own mobile/desktop breakpoint assumption (~640px).
 *  Adjust if your Tailwind `sm:` breakpoint differs. */
const MOBILE_BREAKPOINT = 640;

export function useViewport(): "mobile" | "desktop" {
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("desktop");

  useEffect(() => {
    const update = () => setViewMode(window.innerWidth < MOBILE_BREAKPOINT ? "mobile" : "desktop");
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return viewMode;
}