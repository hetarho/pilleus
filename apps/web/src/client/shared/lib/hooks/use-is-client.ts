"use client";

import { useEffect, useState } from "react";

/**
 * Returns true after the component has mounted on the client.
 *
 * Use this to gate rendering of UI whose output depends on client-only state
 * (TanStack Query cache, browser APIs, localStorage) so the server and the
 * first client render produce the same HTML, then real data renders after
 * hydration.
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}
