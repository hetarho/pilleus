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

export function useBenefitListQuery(productId: string) {
  const trpc = useTRPC();
  return useQuery(trpc.product.benefit.list.queryOptions({ productId }));
}

export function usePersonaListQuery(productId: string) {
  const trpc = useTRPC();
  return useQuery(trpc.product.persona.list.queryOptions({ productId }));
}
