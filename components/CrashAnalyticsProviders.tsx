"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { setCurrentScreen, crashAnalytics } from "@/lib/crash-reporter";

export function ScreenTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const screen = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    setCurrentScreen(screen);
  }, [pathname, searchParams]);

  return null;
}

export function GlobalErrorHandler() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

      crashAnalytics.logCrash(error, {
        isFatal: false,
        severity: "high",
      });
    };

    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return null;
}
