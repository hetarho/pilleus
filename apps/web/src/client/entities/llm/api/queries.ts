"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";

/** Provider/model catalog annotated with per-user credential availability.
 * Drives the model picker — which providers/models exist and which can run
 * server-side right now. */
export function useLlmCatalogQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.llm.catalog.queryOptions());
}

/** The current user's connected BYOK credentials (providerId + key hint, no
 * key). Drives the 마이페이지 connected-state display. */
export function useLlmCredentialListQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.llm.credential.list.queryOptions());
}
