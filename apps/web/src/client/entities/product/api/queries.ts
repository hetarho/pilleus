"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";

export function useProductListQuery(opts?: { enabled?: boolean }) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.product.list.queryOptions(),
    enabled: opts?.enabled,
  });
}
