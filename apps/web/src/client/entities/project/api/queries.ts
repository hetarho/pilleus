"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";

export function useProjectListQuery(opts?: { enabled?: boolean }) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.project.list.queryOptions(),
    enabled: opts?.enabled,
  });
}
